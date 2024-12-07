import { RESULT_STATUS } from "../common/constants.js";

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

// Generate response object
const generateResponse = (isSuccess, message, data) => {
  return {
    status: isSuccess ? RESULT_STATUS.SUCCESS : RESULT_STATUS.ERROR,
    message,
    data,
  };
};

export { locations, generateResponse };