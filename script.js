// Firebase setup and other initializations (no change needed)

// Listen for new orders in Firebase and update the order list in real-time
onValue(ordersRef, function(snapshot) {
    orderList.innerHTML = '';  // Clear the order list before reloading
  
    snapshot.forEach(function(childSnapshot) {
      const order = childSnapshot.val();
      const orderId = childSnapshot.key;
  
      // Create a new HTML element to display the order
      const orderElement = document.createElement('div');
      orderElement.classList.add('order');
      orderElement.setAttribute('id', `order-${orderId}`);
      orderElement.innerHTML = `
        <h3>${order.studentName}</h3>
        <p>Order: ${order.orderItem}</p>
        <p>Status: <span id="status-${orderId}">${order.status}</span></p>
        <button onclick="updateStatus('${orderId}')">Update Status</button>
      `;
  
      // If status is 'Completed', hide the order from the UI
      if (order.status === 'Completed') {
        orderElement.style.display = 'none'; // Hide the order from the frontend
      }
  
      // Append the order to the list
      orderList.appendChild(orderElement);
    });
  });
  
  // Function to update the status of an order
  function updateStatus(orderId) {
    const orderRef = ref(database, 'orders/' + orderId);
    get(orderRef).then(function(snapshot) {
      const order = snapshot.val();
      let newStatus = '';
  
      // Cycle through order statuses
      if (order.status === 'Pending') {
        newStatus = 'Preparing';
      } else if (order.status === 'Preparing') {
        newStatus = 'Ready';
      } else if (order.status === 'Ready') {
        newStatus = 'Completed';
      }
  
      // Update the order status in the database
      update(orderRef, { status: newStatus });
  
      // Update the status text in the UI
      document.getElementById('status-' + orderId).textContent = newStatus;
  
      // If the order is completed, hide it from the UI (but still keep it in the database)
      if (newStatus === 'Completed') {
        document.getElementById(`order-${orderId}`).style.display = 'none';
      }
    });
  }
  