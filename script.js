// The Firebase setup is already initialized in index.html, no need to reinitialize here

// Get references to HTML elements
const orderForm = document.getElementById('order-form');
const studentNameInput = document.getElementById('student-name');
const orderItemInput = document.getElementById('order-item');
const orderList = document.getElementById('order-list');

// Reference to Firebase Realtime Database (orders node)
const ordersRef = ref(database, 'orders');

// Function to handle order submission
orderForm.addEventListener('submit', function(event) {
  event.preventDefault();  // Prevent default form submission

  // Get the values from the input fields
  const studentName = studentNameInput.value;
  const orderItem = orderItemInput.value;

  // Create a new order in the database
  const newOrderRef = push(ordersRef);
  set(newOrderRef, {
    studentName: studentName,
    orderItem: orderItem,
    status: 'Pending',  // Default status is 'Pending'
  });

  // Clear the input fields after submission
  studentNameInput.value = '';
  orderItemInput.value = '';
});

// Listen for new orders in Firebase and update the order list in real-time
onValue(ordersRef, function(snapshot) {
  orderList.innerHTML = '';  // Clear the order list before reloading

  snapshot.forEach(function(childSnapshot) {
    const order = childSnapshot.val();
    const orderId = childSnapshot.key;

    // Create a new HTML element to display the order
    const orderElement = document.createElement('div');
    orderElement.classList.add('order');
    orderElement.innerHTML = `
      <h3>${order.studentName}</h3>
      <p>Order: ${order.orderItem}</p>
      <p>Status: <span id="status-${orderId}">${order.status}</span></p>
      <button onclick="updateStatus('${orderId}')">Update Status</button>
    `;

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
  });
}
