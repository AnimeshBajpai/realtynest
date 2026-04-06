import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { Prisma } from 'generated-prisma-client';
import type {
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyQueryInput,
  LinkLeadInput,
} from '../validators/property.validators.js';

function toJsonImages(images: string[] | null | undefined): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (images === null) return Prisma.JsonNull;
  if (images === undefined) return undefined;
  return images as Prisma.InputJsonValue;
}

const leadNameSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  status: true,
} as const;

export const propertyService = {
  async createProperty(data: CreatePropertyInput, agencyId: string) {
    const { images, ...rest } = data;
    const property = await prisma.property.create({
      data: {
        ...rest,
        images: toJsonImages(images),
        agencyId,
      },
    });

    return property;
  },

  async getProperties(agencyId: string, query: PropertyQueryInput) {
    const { page, limit, search, type, status, minPrice, maxPrice, city, sortBy, sortOrder } =
      query;

    const where: Prisma.PropertyWhereInput = { agencyId };

    if (type) where.type = type;
    if (status) where.status = status;
    if (city) where.city = { contains: city, mode: 'insensitive' };

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    return {
      properties,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getPropertyById(id: string, agencyId: string) {
    const property = await prisma.property.findFirst({
      where: { id, agencyId },
      include: {
        leadProperties: {
          include: {
            lead: { select: leadNameSelect },
          },
        },
      },
    });

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    return property;
  },

  async updateProperty(id: string, agencyId: string, data: UpdatePropertyInput) {
    const existing = await prisma.property.findFirst({
      where: { id, agencyId },
    });

    if (!existing) {
      throw new AppError('Property not found', 404);
    }

    const { images, ...rest } = data;
    const property = await prisma.property.update({
      where: { id },
      data: {
        ...rest,
        ...(images !== undefined ? { images: toJsonImages(images) } : {}),
      },
    });

    return property;
  },

  async deleteProperty(id: string, agencyId: string) {
    const existing = await prisma.property.findFirst({
      where: { id, agencyId },
    });

    if (!existing) {
      throw new AppError('Property not found', 404);
    }

    const linkedLeads = await prisma.leadProperty.count({
      where: { propertyId: id },
    });

    if (linkedLeads > 0) {
      throw new AppError('Cannot delete property with linked leads. Unlink all leads first.', 400);
    }

    await prisma.property.delete({ where: { id } });
  },

  async linkLeadToProperty(propertyId: string, agencyId: string, data: LinkLeadInput) {
    const property = await prisma.property.findFirst({
      where: { id: propertyId, agencyId },
    });

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    const lead = await prisma.lead.findFirst({
      where: { id: data.leadId, agencyId },
    });

    if (!lead) {
      throw new AppError('Lead not found in this agency', 404);
    }

    const existingLink = await prisma.leadProperty.findUnique({
      where: {
        leadId_propertyId: {
          leadId: data.leadId,
          propertyId,
        },
      },
    });

    if (existingLink) {
      throw new AppError('Lead is already linked to this property', 400);
    }

    const leadProperty = await prisma.leadProperty.create({
      data: {
        leadId: data.leadId,
        propertyId,
        interestLevel: data.interestLevel,
        notes: data.notes,
      },
      include: {
        lead: { select: leadNameSelect },
        property: true,
      },
    });

    return leadProperty;
  },

  async unlinkLeadFromProperty(propertyId: string, leadId: string, agencyId: string) {
    const property = await prisma.property.findFirst({
      where: { id: propertyId, agencyId },
    });

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    const leadProperty = await prisma.leadProperty.findUnique({
      where: {
        leadId_propertyId: {
          leadId,
          propertyId,
        },
      },
    });

    if (!leadProperty) {
      throw new AppError('Lead is not linked to this property', 404);
    }

    await prisma.leadProperty.delete({
      where: { id: leadProperty.id },
    });
  },

  async getPropertyLeads(propertyId: string, agencyId: string) {
    const property = await prisma.property.findFirst({
      where: { id: propertyId, agencyId },
    });

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    const leadProperties = await prisma.leadProperty.findMany({
      where: { propertyId },
      include: {
        lead: { select: leadNameSelect },
      },
      orderBy: { createdAt: 'desc' },
    });

    return leadProperties;
  },
};
