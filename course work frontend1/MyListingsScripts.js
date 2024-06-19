document.addEventListener("DOMContentLoaded", function() {
    const myListingContainer = document.getElementById("myListingContainer");
    const notificationDiv = document.getElementById("notification");

    // Function to display user's listings
    function displayUserListings(listings) {
        const listingsContainer = document.getElementById('listings-container');
        if (listingsContainer) {
            // Proceed only if the container element exists
            // Now, you can safely set the innerHTML
            listingsContainer.innerHTML = ''; // Clear previous content
            listings.forEach(listing => {
                // Create HTML elements for each listing and append them to listingsContainer
                const listingElement = document.createElement('div');
                listingElement.classList.add('listing'); // Add the listing class
                listingElement.innerHTML = `
                    <div>Manufacturer: ${listing.make}</div>
                    <div>Model: ${listing.model}</div>
                    <div>Year: ${listing.year}</div>
                    <div>Current Bid: ${listing.price}</div>
                    <img src="${listing.image}" alt="${listing.make} ${listing.model}">
                    <button class="view-details-btn" data-vin="${listing.vin}">View Details</button>
                `;
                
                // Add event listener to the "View Details" button
                const viewDetailsButton = listingElement.querySelector('.view-details-btn');
                viewDetailsButton.addEventListener('click', () => {
                    // Redirect to the details page of the listing
                    window.open(`details.html?vin=${listing.vin}`, "_blank");
                });

                listingsContainer.appendChild(listingElement);
            });
        } else {
            console.error("Listings container element not found.");
        }
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

    // Function to retrieve username and password from local storage
    function getUserCredentialsFromLocalStorage() {
        const username = localStorage.getItem('username');
        const password = localStorage.getItem('password');
        return { username, password };
    }

    // Function to fetch user listings
    async function fetchUserListings(username, password) {
        try {
            const response = await fetch(`http://127.0.0.1:8080/cars/user/${username}/${password}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const responseData = await response.json();
            console.log("Response Data:", responseData.body.data); // Log response data for debugging
            if (responseData.httpStatus === "FOUND" && responseData.body.data) {
                const listings = responseData.body.data.map((listing) => {
                    return {
                        vin: listing.vin,
                        make: listing.make,
                        model: listing.model,
                        year: listing.year,
                        price: listing.price,
                        image: listing.image,
                        bidHistory: listing.bidHistory || [] // Use an empty array if bidHistory is null
                    };
                });
                displayUserListings(listings);
            } else {
                console.error('Error:', responseData.message);
            }
        } catch (error) {
            console.error('Error fetching user listings:', error.message);
        }
    }

    // Fetch and display user's listings on page load
    const { username, password } = getUserCredentialsFromLocalStorage();
    if (username && password) {
        fetchUserListings(username, password);
    } else {
        console.error('Username and password not found in local storage.');
    }
});