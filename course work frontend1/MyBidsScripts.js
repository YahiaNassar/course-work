document.addEventListener("DOMContentLoaded", function() {
    const bidsContainer = document.getElementById("bids-container");
    const notificationDiv = document.createElement("div");
    notificationDiv.id = "notification";
    document.body.appendChild(notificationDiv);

    // Function to display user's bid listings
    function displayUserBidListings(bids) {
        if (bidsContainer) {
            bidsContainer.innerHTML = ''; // Clear previous content
            bids.forEach(bid => {
                // Create HTML elements for each bid and append them to bidsContainer
                const bidElement = document.createElement('div');
                bidElement.classList.add('listing'); // Add the listing class
                bidElement.innerHTML = `
                    <div class="listing-details">
                        <div>Bid ID: ${bid.bidID}</div>
                        <div>Amount: $${bid.amount.toFixed(2)}</div>
                        <div>Date: ${bid.date}</div>
                        <div>Time: ${bid.time}</div>
                        ${bid.vin ? `
                            <div>VIN: ${bid.vin}</div>
                            <button class="view-details-btn" data-vin="${bid.vin}">View Details</button>
                        ` : '<div>VIN: Not available</div>'}
                    </div>
                    ${bid.image ? `<img class="listing-image" src="${bid.image}" alt="Car image">` : ''}
                `;

                if (bid.vin) {
                    const viewDetailsButton = bidElement.querySelector('.view-details-btn');
                    viewDetailsButton.addEventListener('click', () => {
                        // Redirect to the details page of the listing
                        window.open(`details.html?vin=${bid.vin}`, "_blank");
                    });
                }

                bidsContainer.appendChild(bidElement);
            });
        } else {
            console.error("Bids container element not found.");
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

    // Function to fetch car details by VIN
    async function fetchCarDetails(vin) {
        try {
            const response = await fetch(`http://127.0.0.1:8080/cars/vin/${vin}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const responseData = await response.json();
            if (responseData.httpStatus === "ACCEPTED" && responseData.body && responseData.body.data) {
                return responseData.body.data;
            } else {
                console.error('Error:', responseData.message);
                return null;
            }
        } catch (error) {
            console.error('Error fetching car details:', error.message);
            return null;
        }
    }

    // Function to fetch user bids and associated listings
    async function fetchUserBids(username, password) {
        try {
            const response = await fetch(`http://127.0.0.1:8080/bids/find/${username}/${password}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const responseData = await response.json();
            console.log("Response Data:", responseData.body.data); // Log response data for debugging
            if (responseData.httpStatus === "ACCEPTED" && responseData.body.data) {
                const bids = await Promise.all(responseData.body.data.map(async (bid) => {
                    let carDetails = null;
                    if (bid.vin) {
                        carDetails = await fetchCarDetails(bid.vin);
                    }
                    return {
                        bidID: bid.bidID,
                        amount: bid.amount,
                        date: bid.date,
                        time: bid.time,
                        vin: bid.vin,
                        image: carDetails ? carDetails.image : null // Use the car image from the car details
                    };
                }));
                displayUserBidListings(bids);
            } else {
                console.error('Error:', responseData.message);
            }
        } catch (error) {
            console.error('Error fetching user bids:', error.message);
        }
    }

    // Fetch and display user's bid listings on page load
    const { username, password } = getUserCredentialsFromLocalStorage();
    if (username && password) {
        fetchUserBids(username, password);
    } else {
        console.error('Username and password not found in local storage.');
    }
});
