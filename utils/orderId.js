export function generateCustomOrderId() {
    // Get current date details
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0'); // Ensure two digits
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, so add 1
    const year = String(date.getFullYear()).slice(-2); // Get last two digits of the year
    
    // Generate random 5-character string
    const randomString = Math.random().toString(36).substring(2, 7).toUpperCase(); // Generates random string
  
    // Construct the order ID
    const orderId = `SM${day}${month}${year}${randomString}`;
  
    return orderId;
  }
  

  