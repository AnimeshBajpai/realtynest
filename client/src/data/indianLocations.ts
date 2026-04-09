export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry',
  'Andaman and Nicobar Islands', 'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep',
] as const

export const CITIES_BY_STATE: Record<string, string[]> = {
  'Andhra Pradesh': [
    'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Rajahmundry',
    'Kakinada', 'Kadapa', 'Anantapur', 'Eluru', 'Ongole', 'Machilipatnam', 'Tenali', 'Proddatur',
    'Vizianagaram', 'Srikakulam', 'Adoni', 'Hindupur', 'Chittoor', 'Bhimavaram', 'Narasaraopet',
    'Tadepalligudem', 'Chirala', 'Gudivada', 'Amalapuram', 'Nandyal', 'Markapur', 'Dharmavaram',
    'Kavali', 'Chilakaluripet', 'Bapatla', 'Tadipatri', 'Palakollu', 'Rajam',
  ],
  'Bihar': [
    'Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Arrah', 'Begusarai',
    'Katihar', 'Munger', 'Chhapra', 'Saharsa', 'Bihar Sharif', 'Sasaram', 'Dehri', 'Sitamarhi',
    'Siwan', 'Motihari', 'Hajipur', 'Bettiah', 'Kishanganj', 'Jamalpur', 'Buxar', 'Jehanabad',
    'Aurangabad', 'Nawada', 'Samastipur', 'Madhubani', 'Gopalganj', 'Madhepura', 'Supaul',
  ],
  'Chhattisgarh': [
    'Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Ambikapur',
    'Raigarh', 'Dhamtari', 'Mahasamund', 'Kawardha', 'Kanker', 'Janjgir', 'Champa', 'Bemetara',
  ],
  'Delhi': [
    'New Delhi', 'Dwarka', 'Rohini', 'Saket', 'Vasant Kunj', 'Janakpuri', 'Lajpat Nagar',
    'Karol Bagh', 'Connaught Place', 'Nehru Place', 'Pitampura', 'Greater Kailash', 'Hauz Khas',
    'Malviya Nagar', 'Patel Nagar', 'Rajouri Garden', 'Tilak Nagar', 'Vikaspuri', 'Uttam Nagar',
    'Paschim Vihar', 'Shahdara', 'Preet Vihar', 'Mayur Vihar', 'Laxmi Nagar', 'Geeta Colony',
    'Sarita Vihar', 'Okhla', 'Defence Colony', 'Green Park', 'Kalkaji', 'Chanakyapuri',
    'Mehrauli', 'Narela', 'Burari', 'Model Town', 'Civil Lines', 'Chandni Chowk',
  ],
  'Goa': [
    'Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Calangute', 'Candolim',
    'Bicholim', 'Curchorem', 'Sanguem', 'Quepem', 'Canacona', 'Sanquelim', 'Pernem',
  ],
  'Gujarat': [
    'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh',
    'Gandhinagar', 'Anand', 'Nadiad', 'Morbi', 'Mehsana', 'Bharuch', 'Navsari', 'Valsad',
    'Vapi', 'Porbandar', 'Godhra', 'Botad', 'Palanpur', 'Surendranagar', 'Veraval', 'Patan',
    'Dahod', 'Kutch', 'Bhuj', 'Amreli', 'Gandhidham', 'Kalol', 'Halol', 'Mundra', 'Dwarka',
  ],
  'Haryana': [
    'Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal',
    'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa', 'Rewari', 'Jhajjar', 'Jind', 'Kaithal',
    'Palwal', 'Kurukshetra', 'Bahadurgarh', 'Manesar', 'Sohna', 'Dharuhera', 'Narnaul',
    'Mahendragarh', 'Fatehabad', 'Hansi', 'Tohana', 'Samalkha', 'Hodal', 'Charkhi Dadri',
  ],
  'Himachal Pradesh': [
    'Shimla', 'Dharamshala', 'Mandi', 'Solan', 'Kullu', 'Manali', 'Bilaspur', 'Kangra',
    'Hamirpur', 'Palampur', 'Nahan', 'Una', 'Chamba', 'Dalhousie', 'Kasauli', 'Keylong',
  ],
  'Jharkhand': [
    'Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih', 'Ramgarh',
    'Phusro', 'Medininagar', 'Chaibasa', 'Dumka', 'Chatra', 'Godda', 'Koderma', 'Lohardaga',
    'Pakur', 'Sahebganj', 'Simdega', 'Gumla', 'Latehar',
  ],
  'Karnataka': [
    'Bengaluru', 'Mysuru', 'Hubli', 'Mangalore', 'Belgaum', 'Davangere', 'Bellary', 'Gulbarga',
    'Shimoga', 'Tumkur', 'Udupi', 'Hassan', 'Raichur', 'Bijapur', 'Dharwad', 'Chitradurga',
    'Mandya', 'Chikmagalur', 'Kolar', 'Hospet', 'Gadag', 'Bidar', 'Robertson Pet', 'Bhadravati',
    'Bagalkot', 'Ranebennur', 'Gangavathi', 'Karwar', 'Yadgir', 'Chamarajanagar', 'Puttur',
    'Sirsi', 'Gokak', 'Dandeli', 'Mudhol', 'Jamkhandi',
  ],
  'Kerala': [
    'Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha',
    'Kannur', 'Kottayam', 'Malappuram', 'Thalassery', 'Kasaragod', 'Kayamkulam', 'Manjeri',
    'Attingal', 'Tirur', 'Perinthalmanna', 'Changanassery', 'Punalur', 'Neyyattinkara',
    'Pala', 'Vadakara', 'Payyanur', 'Adoor', 'Chalakudy', 'Shoranur', 'Ottappalam',
    'Cherthala', 'Mattannur', 'North Paravur', 'Guruvayoor', 'Munnar', 'Wayanad',
  ],
  'Madhya Pradesh': [
    'Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam',
    'Rewa', 'Murwara', 'Singrauli', 'Burhanpur', 'Khandwa', 'Bhind', 'Shivpuri', 'Vidisha',
    'Chhindwara', 'Mandsaur', 'Hoshangabad', 'Itarsi', 'Damoh', 'Neemuch', 'Seoni', 'Datia',
    'Khargone', 'Tikamgarh', 'Chhatarpur', 'Guna', 'Shajapur', 'Morena', 'Betul', 'Katni',
  ],
  'Maharashtra': [
    'Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur',
    'Navi Mumbai', 'Amravati', 'Sangli', 'Malegaon', 'Jalgaon', 'Akola', 'Latur', 'Ahmednagar',
    'Dhule', 'Vasai-Virar', 'Chandrapur', 'Palghar', 'Ichalkaranji', 'Parbhani', 'Jalna',
    'Bhiwandi', 'Panvel', 'Satara', 'Beed', 'Yavatmal', 'Nanded', 'Gondia', 'Wardha', 'Ratnagiri',
    'Osmanabad', 'Hingoli', 'Washim', 'Buldhana', 'Sindhudurg', 'Kalyan', 'Dombivli', 'Mira-Bhayandar',
    'Ulhasnagar', 'Ambernath', 'Badlapur', 'Khopoli', 'Karjat', 'Lonavala', 'Alibaug',
  ],
  'Odisha': [
    'Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Baripada',
    'Bhadrak', 'Jharsuguda', 'Koraput', 'Jeypore', 'Kendrapara', 'Angul', 'Dhenkanal', 'Rayagada',
    'Paradip', 'Barbil', 'Sunabeda', 'Sonepur', 'Phulbani', 'Bolangir', 'Bargarh',
  ],
  'Punjab': [
    'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot',
    'Hoshiarpur', 'Moga', 'Phagwara', 'Barnala', 'Kapurthala', 'Batala', 'Muktsar', 'Rajpura',
    'Firozpur', 'Abohar', 'Malerkotla', 'Khanna', 'Sangrur', 'Nawanshahr', 'Faridkot', 'Dera Bassi',
    'Zirakpur', 'Derabassi', 'Kharar', 'Gobindgarh', 'Rupnagar', 'Samana', 'Sunam',
  ],
  'Rajasthan': [
    'Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur',
    'Sikar', 'Pali', 'Sri Ganganagar', 'Tonk', 'Beawar', 'Hanumangarh', 'Dhaulpur', 'Gangapur City',
    'Sawai Madhopur', 'Barmer', 'Churu', 'Jhunjhunu', 'Nagaur', 'Kishangarh', 'Makrana',
    'Sujangarh', 'Sardarshahar', 'Ladnu', 'Didwana', 'Nathdwara', 'Rajsamand', 'Pushkar',
    'Dungarpur', 'Banswara', 'Pratapgarh', 'Bundi', 'Jhalawar', 'Chittorgarh', 'Baran',
    'Sirohi', 'Mount Abu', 'Jaisalmer', 'Dausa', 'Karauli',
  ],
  'Tamil Nadu': [
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode',
    'Vellore', 'Thoothukudi', 'Thanjavur', 'Dindigul', 'Hosur', 'Nagercoil', 'Kanchipuram',
    'Tirupur', 'Cuddalore', 'Kumbakonam', 'Tiruvannamalai', 'Pollachi', 'Rajapalayam',
    'Sivakasi', 'Villupuram', 'Tindivanam', 'Karur', 'Namakkal', 'Virudhunagar', 'Ambur',
    'Vaniyambadi', 'Ariyalur', 'Perambalur', 'Pudukkottai', 'Nagapattinam', 'Mayiladuthurai',
    'Dharmapuri', 'Krishnagiri', 'Ooty', 'Kodaikanal', 'Coonoor', 'Arakkonam', 'Ranipet',
  ],
  'Telangana': [
    'Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Ramagundam', 'Khammam', 'Mahbubnagar',
    'Nalgonda', 'Adilabad', 'Secunderabad', 'Siddipet', 'Miryalaguda', 'Suryapet', 'Jagtial',
    'Mancherial', 'Nirmal', 'Kamareddy', 'Bodhan', 'Medak', 'Sangareddy', 'Vikarabad',
    'Zaheerabad', 'Narayanpet', 'Wanaparthy', 'Gadwal', 'Medchal', 'Shamshabad', 'Uppal',
    'Kukatpally', 'Gachibowli', 'Madhapur', 'Kondapur', 'Miyapur', 'Kompally', 'LB Nagar',
  ],
  'Uttar Pradesh': [
    'Lucknow', 'Noida', 'Greater Noida', 'Ghaziabad', 'Kanpur', 'Agra', 'Varanasi', 'Meerut',
    'Prayagraj', 'Bareilly', 'Aligarh', 'Moradabad', 'Gorakhpur', 'Saharanpur', 'Jhansi',
    'Mathura', 'Firozabad', 'Muzaffarnagar', 'Shahjahanpur', 'Ayodhya', 'Faizabad', 'Sultanpur',
    'Rae Bareli', 'Unnao', 'Hardoi', 'Sitapur', 'Lakhimpur Kheri', 'Bahraich', 'Gonda',
    'Basti', 'Deoria', 'Azamgarh', 'Jaunpur', 'Mirzapur', 'Sonbhadra', 'Bhadohi',
    'Pratapgarh', 'Fatehpur', 'Banda', 'Hamirpur', 'Mahoba', 'Chitrakoot', 'Lalitpur',
    'Etawah', 'Mainpuri', 'Budaun', 'Rampur', 'Bijnor', 'Amroha', 'Sambhal', 'Chandausi',
    'Hathras', 'Etah', 'Kasganj', 'Farrukhabad', 'Kannauj', 'Auraiya', 'Orai',
    'Bulandshahr', 'Hapur', 'Khurja', 'Sikandrabad', 'Dadri', 'Jewar', 'Pilkhuwa',
    'Baghpat', 'Shamli', 'Kairana', 'Deoband', 'Roorkee', 'Muzaffarnagar', 'Bijnor',
    'Najibabad', 'Nagina', 'Dhampur', 'Baraut', 'Sardhana', 'Mawana', 'Kithor',
    'Muradnagar', 'Modinagar', 'Loni', 'Tronica City', 'Ghazipur', 'Ballia', 'Mau',
    'Kushinagar', 'Padrauna', 'Maharajganj', 'Nautanwa', 'Pharenda', 'Tanda', 'Akbarpur',
    'Ambedkar Nagar', 'Amethi', 'Barabanki', 'Faizabad', 'Ayodhya', 'Shravasti',
  ],
  'Uttarakhand': [
    'Dehradun', 'Haridwar', 'Rishikesh', 'Haldwani', 'Roorkee', 'Rudrapur', 'Kashipur',
    'Nainital', 'Mussoorie', 'Kotdwar', 'Ramnagar', 'Pithoragarh', 'Almora', 'Champawat',
    'Bageshwar', 'Uttarkashi', 'Tehri', 'Srinagar', 'Pauri', 'Lansdowne', 'Bhimtal',
    'Rudraprayag', 'Chamoli', 'Joshimath',
  ],
  'West Bengal': [
    'Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Baharampur',
    'Habra', 'Kharagpur', 'Shantiniketan', 'Kalyani', 'Haldia', 'Raiganj', 'Krishnanagar',
    'Nabadwip', 'Balurghat', 'Bankura', 'Purulia', 'Medinipur', 'Jangipur', 'Ranaghat',
    'Cooch Behar', 'Jalpaiguri', 'Alipurduar', 'Darjeeling', 'Kalimpong', 'Diamond Harbour',
    'Basirhat', 'Barrackpore', 'Serampore', 'Chandannagar', 'Hooghly', 'Rishra', 'Uttarpara',
    'Bally', 'Naihati', 'Titagarh', 'Baranagar', 'Dumdum', 'South Dumdum', 'Bhatpara',
  ],
  'Chandigarh': ['Chandigarh'],
  'Jammu and Kashmir': [
    'Srinagar', 'Jammu', 'Anantnag', 'Sopore', 'Baramulla', 'Kathua', 'Udhampur',
    'Pulwama', 'Shopian', 'Kupwara', 'Bandipora', 'Ganderbal', 'Budgam', 'Kulgam',
    'Rajouri', 'Poonch', 'Doda', 'Kishtwar', 'Ramban', 'Reasi', 'Samba',
  ],
  'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
  'Arunachal Pradesh': [
    'Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro', 'Bomdila', 'Along', 'Tezu',
    'Roing', 'Changlang', 'Khonsa', 'Namsai',
  ],
  'Assam': [
    'Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur',
    'Bongaigaon', 'Dhubri', 'North Lakhimpur', 'Goalpara', 'Karimganj', 'Sivasagar',
    'Golaghat', 'Barpeta', 'Mangaldoi', 'Diphu', 'Kokrajhar', 'Nalbari', 'Hojai',
  ],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Ukhrul', 'Senapati', 'Tamenglong'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongstoin', 'Williamnagar', 'Baghmara', 'Resubelpara'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib', 'Saiha', 'Lawngtlai', 'Mamit'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Mon', 'Phek'],
  'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Rangpo', 'Singtam', 'Jorethang'],
  'Tripura': ['Agartala', 'Dharmanagar', 'Udaipur', 'Kailashahar', 'Belonia', 'Ambassa', 'Khowai', 'Sabroom'],
  'Ladakh': ['Leh', 'Kargil', 'Diskit', 'Padum'],
  'Andaman and Nicobar Islands': ['Port Blair', 'Car Nicobar', 'Mayabunder', 'Diglipur'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Silvassa', 'Daman', 'Diu'],
  'Lakshadweep': ['Kavaratti', 'Andrott', 'Minicoy'],
}

// Flat list of ALL cities for quick searching
export const ALL_CITIES: string[] = [...new Set(Object.values(CITIES_BY_STATE).flat())].sort()

// Helper: get cities for a given state (case-insensitive)
export function getCitiesForState(state: string): string[] {
  const key = Object.keys(CITIES_BY_STATE).find(
    (k) => k.toLowerCase() === state.toLowerCase()
  )
  return key ? CITIES_BY_STATE[key] : []
}
