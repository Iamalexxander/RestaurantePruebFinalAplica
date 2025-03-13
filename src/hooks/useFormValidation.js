import { useState } from 'react';

const useFormValidation = (initialState, validationRules) => {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const handleChange = (name, value) => {
    setValues(prevValues => ({
      ...prevValues,
      [name]: value
    }));
    
    // Validate on change if field was already touched
    if (touched[name]) {
      validateField(name, value);
    }
  };
  
  const handleBlur = (name) => {
    setTouched(prevTouched => ({
      ...prevTouched,
      [name]: true
    }));
    
    validateField(name, values[name]);
  };
  
  const validateField = (name, value) => {
    const rule = validationRules[name];
    if (!rule) return;
    
    const error = rule(value, values);
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: error
    }));
  };
  
  const validateAll = () => {
    const newErrors = {};
    let isValid = true;
    
    Object.keys(validationRules).forEach(name => {
      const value = values[name];
      const error = validationRules[name](value, values);
      
      if (error) {
        isValid = false;
        newErrors[name] = error;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };
  
  const reset = () => {
    setValues(initialState);
    setErrors({});
    setTouched({});
  };
  
  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset
  };
};

export default useFormValidation;