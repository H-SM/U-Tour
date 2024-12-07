const FIXED_HOURS = [
  // { value: "05:00", label: "5 AM" },
  // { value: "06:00", label: "6 AM" },
  // { value: "07:00", label: "7 AM" },
  // { value: "08:00", label: "8 AM" },
  { value: "09:00", label: "9 AM" },
  { value: "10:00", label: "10 AM" },
  { value: "11:00", label: "11 AM" },
  { value: "12:00", label: "12 PM" },
  { value: "13:00", label: "1 PM" },
  { value: "14:00", label: "2 PM" },
  { value: "15:00", label: "3 PM" },
  { value: "16:00", label: "4 PM" },
  { value: "17:00", label: "5 PM" },
  // { value: "18:00", label: "6 PM" },
];

const locations = [
  { value: "Bidholi-magic-stand", label: "Main Gate" },
  { value: "upes-hubble", label: "The Hubble" },
  { value: "aditya-block", label: "Aditya Block" },
  { value: "upes-cricket-ground", label: "Cricket Ground" },
  { value: "upes-library", label: "UPES Library" },
  { value: "upes-food-court", label: "Food Court" },
  { value: "upes-9th-block", label: "Block 9" },
  { value: "upes-10th-block", label: "10th Block" },
];

const RESULT_STATUS = {
  ERROR: "error",
  SUCCESS: "success",
  EMPTY: "empty",
};

export { FIXED_HOURS, locations, RESULT_STATUS };
