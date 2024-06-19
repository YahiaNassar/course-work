document.addEventListener("DOMContentLoaded", function() {
    const carList = document.getElementById("carList");
    const addCarButton = document.getElementById("addCarButton");
    const addCarModal = document.getElementById("addCarModal");
    const addCarForm = document.getElementById("addCarForm");
    const modalCloseButtons = document.querySelectorAll(".close");
    const loginButton = document.getElementById("logoutButton");
    const loginModal = document.getElementById("loginModal");
    const loginForm = document.getElementById("loginForm");
    const notificationDiv = document.getElementById("notification");
    const openFilterModalButton = document.getElementById("openFilterModalButton");
    const searchBar = document.getElementById("searchBar");
    const searchButton = document.getElementById("searchButton");

    const manufacturerFilter = document.getElementById("manufacturerFilter");
    const modelFilter = document.getElementById("modelFilter");
    const yearFilter = document.getElementById("yearFilter");
    const minPrice = document.getElementById("minPrice");
    const maxPrice = document.getElementById("maxPrice");
    const filterModal = document.getElementById("filterModal");
    const applyFilterButton = document.getElementById("applyFilterButton");

    let carsData = [];

    // Function to display cars on the page
    function displayCars(cars) {
        carList.innerHTML = "";
        cars.forEach((car, index) => {
            const carDiv = document.createElement("div");
            carDiv.classList.add("car");
            carDiv.innerHTML = `
                <img src="${car.image}" alt="${car.make} ${car.model}">
                <h2>${car.make} ${car.model}</h2>
                <p>Year: ${car.year}</p>
                <p>Current bid: $${car.price}</p>
                <button class="details-btn" data-vin="${car.vin}">View Details</button>
            `;
            carList.appendChild(carDiv);
        });
    }

    // Function to open the modal
    function openModal(modal) {
        modal.style.display = "block";
    }

    // Function to close the modal
    function closeModal(modal) {
        modal.style.display = "none";
    }

    // Function to show notifications
    function showNotification(message, type) {
        notificationDiv.textContent = message;
        notificationDiv.className = `notification ${type}`;
        notificationDiv.style.display = 'block';

        setTimeout(() => {
            notificationDiv.style.display = 'none';
        }, 3000);
    }

    // Function to open the filter modal
    function openFilterModal() {
        filterModal.style.display = "block";
    }

    // Event listener for clicking "Add New Car" button
    addCarButton.addEventListener("click", function() {
        openModal(addCarModal);
    });

    // Event listener for clicking "Log in" button
    loginButton.addEventListener("click", function() {
        openModal(loginModal);
    });

    // Event listener for closing modals
    modalCloseButtons.forEach(function(button) {
        button.addEventListener("click", function() {
            closeModal(addCarModal);
            closeModal(loginModal);
            closeModal(filterModal);
        });
    });

    // Event listener for clicking "Log out" button
    button1.addEventListener("click", function() {
        // Clear username and password from local storage
        localStorage.removeItem('username');
        localStorage.removeItem('password');

        // Refresh the page
        location.reload();
    });

    // Event listener for form submission to add new car
    addCarForm.addEventListener("submit", function(event) {
        event.preventDefault();

        // Get the form data
        const formData = new FormData(addCarForm);

        // Convert the form data to a JSON object
        const jsonData = Object.fromEntries(formData.entries());

        // Get username and password from local storage
        const username = localStorage.getItem('username');
        const password = localStorage.getItem('password');

        // Check if the user is logged in
        if (!username || !password) {
            // Show a notification if the user is not logged in
            showNotification('You must sign in to add a submission', 'error');
            return; // Stop further execution
        }

        // Add the logged-in username to the JSON data
        jsonData.listerUsername = username;

        // Send the JSON data to the server using fetch
        fetch(`http://127.0.0.1:8080/cars/add/${username}/${password}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData)
        })
        .then(response => {
            if (response.ok) {
                // If the request was successful, close the modal and reset the form
                addCarModal.style.display = 'none';
                addCarForm.reset();
                showNotification('Car added successfully!', 'success');
                fetchCarsFromDB(); // Refresh the car list
            } else {
                // If the request failed, display an error message
                console.error('Error:', response.statusText);
                showNotification('A server error occurred while adding the listing. Please try again later.', 'error');
            }
        })
        .catch(error => {
            // If there was a network error, display an error message
            console.error('Error:', error);
            showNotification('A network error occurred while adding the listing. Please try again later.', 'error');
        });
    });

    // Event listener for form submission to log in
    loginForm.addEventListener("submit", function(event) {
        event.preventDefault();

        // Get the form data
        const formData = new FormData(loginForm);

        // Convert the form data to a JSON object
        const jsonData = Object.fromEntries(formData.entries());

        // Store the data in local storage
        localStorage.setItem('username', jsonData.username);
        localStorage.setItem('password', jsonData.password);
        

        // Log in the user
        loginUser(jsonData.username, jsonData.password);
    });

    // Function to log in the user
    async function loginUser(username, password) {
        const loginData = {
            name: username.toUpperCase(),
            username: username,
            password: password,
            isAdmin: "N"
        };

        try {
            const response = await fetch('http://127.0.0.1:8080/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const responseData = await response.json();

            if (responseData.httpStatus === "ACCEPTED" && responseData.body.data) {
                // If login is successful, close the modal and show success notification
                loginModal.style.display = 'none';
                showNotification('Login successful!', 'success');

                // Check if the user is an admin
                if (responseData.body.data.isAdmin === 'Y') {
                    // Make the admin button visible
                    const adminPageButton = document.getElementById('Admin-Page');
                    adminPageButton.style.display = 'block';
                    // Add event listener to admin page button
                    adminPageButton.addEventListener('click', function() {
                        window.location.href = 'admin.html';
                    });
                }
            } else if (responseData.httpStatus === "BAD_REQUEST" && responseData.message === "Username taken!") {
                // If the username is taken, try logging in
                loginWithExistingUser(username, password);
            } else {
                // If the login failed, show error notification
                showNotification('Wrong username or password.', 'error');
            }
        } catch (error) {
            // If there was a network error, show error notification
            console.error('Error:', error);
            showNotification('A network error occurred while logging in. Please try again later.', 'error');
        }
    }

    // Function to log in with an existing user
    async function loginWithExistingUser(username, password) {
        try {
            const response = await fetch(`http://127.0.0.1:8080/login/${username}/${password}`, {
                method: 'GET'
            });

            const responseData = await response.json();

            if (responseData.httpStatus === "FOUND" && responseData.body.data) {
                // If login is successful, close the modal and show success notification
                loginModal.style.display = 'none';
                showNotification('Login successful!', 'success');

                // Check if the user is an admin
                if (responseData.body.data.isAdmin === 'Y') {
                    // Make the admin button visible
                    const adminPageButton = document.getElementById('Admin-Page');
                    adminPageButton.style.display = 'block';
                    // Add event listener to admin page button
                    adminPageButton.addEventListener('click', function() {
                        window.location.href = 'admin.html';
                    });
                }
            } else {
                // If the login failed, show error notification
                showNotification('Wrong username or password.', 'error');
            }
        } catch (error) {
            // If there was a network error, show error notification
            console.error('Error:', error);
            showNotification('A network error occurred while logging in. Please try again later.', 'error');
        }
    }

    // Check if user is already logged in
    function checkLoginStatus() {
        const username = localStorage.getItem('username');
        const password = localStorage.getItem('password');

        if (username && password) {
            loginUser(username, password);
        }
    }

    // Event listener for clicking "View Details" button
    carList.addEventListener("click", function(event) {
        if (event.target.classList.contains("details-btn")) {
            const vin = event.target.dataset.vin;
            window.open(`details.html?vin=${vin}`, "_blank");
        }
    });

    // Function to fetch cars from the database
    async function fetchCarsFromDB() {
        try {
            const response = await fetch('http://127.0.0.1:8080/cars/all');
            const data = await response.json();
            carsData = data.body.data; // Store the fetched cars data
            displayCars(carsData);
        } catch (error) {
            console.error('Error fetching cars:', error);
        }
    }

    // Event listener for clicking the search button
    searchButton.addEventListener("click", function() {
        const searchTerm = searchBar.value.toLowerCase();
        const filteredCars = carsData.filter(car => 
            car.make.toLowerCase().includes(searchTerm) || 
            car.model.toLowerCase().includes(searchTerm)
        );
        displayCars(filteredCars);
    });

    // Function to apply filters
    function applyFilters() {
        const manufacturer = manufacturerFilter.value.toLowerCase();
        const model = modelFilter.value.toLowerCase();
        const year = yearFilter.value;
        const min = minPrice.value;
        const max = maxPrice.value;

        const filteredCars = carsData.filter(car => {
            const matchesManufacturer = car.make.toLowerCase().includes(manufacturer);
            const matchesModel = car.model.toLowerCase().includes(model);
            const matchesYear = !year || +car.year === +year;
            const matchesPrice = (!min || car.price >= +min) && (!max || car.price <= +max);

            return matchesManufacturer && matchesModel && matchesYear && matchesPrice;
        });

        displayCars(filteredCars);
        closeModal(filterModal);
    }

    // Event listener for clicking the filter button
    openFilterModalButton.addEventListener("click", openFilterModal);

    // Event listener for applying filters
    applyFilterButton.addEventListener("click", applyFilters);

    // Event listener for closing the filter modal
    const filterModalCloseButton = document.querySelector("#filterModal .close");
    filterModalCloseButton.addEventListener("click", function() {
        closeModal(filterModal);
    });

    // Initial loading of cars from the database
    fetchCarsFromDB();

    // Check login status on page load
    checkLoginStatus();
});