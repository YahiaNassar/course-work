document.addEventListener("DOMContentLoaded", function() {
    const carTable = document.getElementById("carListAdmin").getElementsByTagName('tbody')[0];
    const userTable = document.getElementById("userList").getElementsByTagName('tbody')[0];
    const notificationDiv = document.getElementById("notification");
    const homeButton = document.getElementById("homeButton");

    homeButton.addEventListener("click", function() {
        window.location.href = "index.html";
    });

    function displayCarListings(cars) {
        carTable.innerHTML = "";
        cars.forEach(car => {
            const row = carTable.insertRow();
            row.innerHTML = `
                <td>${car.vin}</td>
                <td>${car.make}</td>
                <td>${car.model}</td>
                <td>${car.year}</td>
                <td>$${car.price}</td>
                <td>${car.mileage ? car.mileage : 'N/A'}</td>
                <td>${car.carStatus ? car.carStatus : 'N/A'}</td>
                <td>${car.lister ? car.lister.username : 'N/A'}</td>
                <td><img src="${car.image}" alt="${car.make} ${car.model}" style="max-width: 100px; max-height: 100px;"></td>
                <td>
                    <button class="deactivate-car-btn" data-vin="${car.vin}">Deactivate</button>
                    <button class="delete-car-btn" data-vin="${car.vin}">Remove</button>
                </td>
            `;
        });
    }

    function displayUsers(users) {
        userTable.innerHTML = "";
        users.forEach(user => {
            const row = userTable.insertRow();
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.username}</td>
                <td>${user.isAdmin}</td>
                <td>${user.userStatus}</td>
                <td>
                    <button class="block-user-btn" data-username="${user.username}">Block User</button>
                </td>
            `;
        });
    }

    function showNotification(message, type) {
        notificationDiv.textContent = message;
        notificationDiv.className = `notification ${type}`;
        notificationDiv.style.display = 'block';

        setTimeout(() => {
            notificationDiv.style.display = 'none';
        }, 3000);
    }

    async function fetchCarListings() {
        try {
            const response = await fetch('http://127.0.0.1:8080/cars/all');
            const data = await response.json();
            displayCarListings(data.body.data);
        } catch (error) {
            console.error('Error fetching car listings:', error);
            showNotification('Error fetching car listings', 'error');
        }
    }

    async function fetchUsers() {
        try {
            const response = await fetch(`http://127.0.0.1:8080/all/${localStorage.getItem('username')}/${localStorage.getItem('password')}`);
            const data = await response.json();
            displayUsers(data.body.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            showNotification('Error fetching users', 'error');
        }
    }

    carTable.addEventListener("click", async function(event) {
        if (event.target.classList.contains("deactivate-car-btn")) {
            const vin = event.target.dataset.vin;
            const username = localStorage.getItem('username');
            const password = localStorage.getItem('password');

            if (!username || !password) {
                showNotification('You must be logged in to deactivate a car', 'error');
                return;
            }

            try {
                const response = await fetch(`http://127.0.0.1:8080/cars/deactivate/${vin}/${username}/${password}`, {
                    method: 'POST'
                });
                if (response.ok) {
                    showNotification('Car deactivated successfully!', 'success');
                    fetchCarListings();
                } else {
                    showNotification('Error deactivating car', 'error');
                }
            } catch (error) {
                console.error('Error deactivating car:', error);
                showNotification('Error deactivating car', 'error');
            }
        } else if (event.target.classList.contains("delete-car-btn")) {
            const vin = event.target.dataset.vin;
            const username = localStorage.getItem('username');
            const password = localStorage.getItem('password');

            if (!username || !password) {
                showNotification('You must be logged in to delete a car', 'error');
                return;
            }

            try {
                const response = await fetch(`http://127.0.0.1:8080/cars/delete/${vin}/${username}/${password}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    showNotification('Car deleted successfully!', 'success');
                    fetchCarListings();
                } else {
                    showNotification('Error deleting car', 'error');
                }
            } catch (error) {
                console.error('Error deleting car:', error);
                showNotification('Error deleting car', 'error');
            }
        }
    });

    userTable.addEventListener("click", async function(event) {
        if (event.target.classList.contains("block-user-btn")) {
            const usernameToBlock = event.target.dataset.username;
            const username = localStorage.getItem('username');
            const password = localStorage.getItem('password');

            if (!username || !password) {
                showNotification('You must be logged in to block a user', 'error');
                return;
            }

            try {
                const response = await fetch(`http://127.0.0.1:8080/block/${usernameToBlock}/${username}/${password}`, {
                    method: 'POST'
                });
                if (response.ok) {
                    showNotification('User blocked successfully!', 'success');
                    fetchUsers();
                } else {
                    showNotification('Error blocking user', 'error');
                }
            } catch (error) {
                console.error('Error blocking user:', error);
                showNotification('Error blocking user', 'error');
            }
        }
    });

    fetchCarListings();
    fetchUsers();
});
