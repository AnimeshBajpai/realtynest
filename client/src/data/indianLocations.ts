export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry',
  'Andaman and Nicobar Islands', 'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep',
] as const

// Map state to major cities (top ~15 cities per key state, fewer for smaller states)
export const CITIES_BY_STATE: Record<string, string[]> = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Rajahmundry', 'Kakinada', 'Kadapa', 'Anantapur', 'Eluru', 'Ongole', 'Machilipatnam'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chhapra', 'Saharsa'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Ambikapur'],
  'Delhi': ['New Delhi', 'Dwarka', 'Rohini', 'Saket', 'Vasant Kunj', 'Janakpuri', 'Lajpat Nagar', 'Karol Bagh', 'Connaught Place', 'Nehru Place', 'Pitampura', 'Greater Kailash', 'Hauz Khas', 'Malviya Nagar'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Calangute', 'Candolim'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Anand', 'Nadiad', 'Morbi', 'Mehsana', 'Bharuch', 'Navsari', 'Valsad'],
  'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa', 'Rewari'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Mandi', 'Solan', 'Kullu', 'Manali', 'Bilaspur', 'Kangra'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih', 'Ramgarh'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubli', 'Mangalore', 'Belgaum', 'Davangere', 'Bellary', 'Gulbarga', 'Shimoga', 'Tumkur', 'Udupi', 'Hassan', 'Raichur'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha', 'Kannur', 'Kottayam', 'Malappuram'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Murwara', 'Singrauli', 'Burhanpur'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Navi Mumbai', 'Amravati', 'Sangli', 'Malegaon', 'Jalgaon', 'Akola', 'Latur', 'Ahmednagar', 'Dhule', 'Vasai-Virar', 'Chandrapur', 'Palghar'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Baripada'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur', 'Moga', 'Phagwara'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar', 'Pali', 'Sri Ganganagar', 'Tonk'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi', 'Thanjavur', 'Dindigul', 'Hosur', 'Nagercoil', 'Kanchipuram'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Ramagundam', 'Khammam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Secunderabad'],
  'Uttar Pradesh': ['Lucknow', 'Noida', 'Greater Noida', 'Ghaziabad', 'Kanpur', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj', 'Bareilly', 'Aligarh', 'Moradabad', 'Gorakhpur', 'Saharanpur', 'Jhansi', 'Mathura', 'Firozabad', 'Muzaffarnagar', 'Shahjahanpur'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Rishikesh', 'Haldwani', 'Roorkee', 'Rudrapur', 'Kashipur', 'Nainital', 'Mussoorie'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Baharampur', 'Habra', 'Kharagpur', 'Shantiniketan', 'Kalyani'],
  'Chandigarh': ['Chandigarh'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Sopore', 'Baramulla', 'Kathua', 'Udhampur'],
  'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Champhai'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung'],
  'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing'],
  'Tripura': ['Agartala', 'Dharmanagar', 'Udaipur'],
  'Ladakh': ['Leh', 'Kargil'],
}

// Flat list of ALL cities for quick searching
export const ALL_CITIES: string[] = Object.values(CITIES_BY_STATE).flat()

// Helper: get cities for a given state (case-insensitive)
export function getCitiesForState(state: string): string[] {
  const key = Object.keys(CITIES_BY_STATE).find(
    (k) => k.toLowerCase() === state.toLowerCase()
  )
  return key ? CITIES_BY_STATE[key] : []
}
