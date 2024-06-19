document.addEventListener("DOMContentLoaded", function() {
    // Function to show the bid modal
    function showBidModal() {
        const bidModal = document.getElementById('bidModal');
        bidModal.style.display = 'block';
    }

    // Function to close the bid modal
    function closeBidModal() {
        const bidModal = document.getElementById('bidModal');
        bidModal.style.display = 'none';
    }

    // Function to submit the bid
    function submitBid() {
        const bidAmountInput = document.getElementById('bidAmount');
        const bidAmount = parseFloat(bidAmountInput.value);

        if (isNaN(bidAmount) || bidAmount <= 0) {
            alert('Please enter a valid bid amount.');
            return;
        }

        const username = localStorage.getItem('username');
        const urlParams = new URLSearchParams(window.location.search);
        const index = urlParams.get('vin');

        fetch(`http://127.0.0.1:8080/cars/vin/${index}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(car => {
                const lister = car.body.data.lister;

                if (lister && lister.username === username) {
                    alert('You cannot bid on your own listing.');
                    return;
                }

                const currentPrice = car.body.data.price;

                if (bidAmount <= currentPrice) {
                    alert('Your bid must be higher than the current price.');
                    return;
                }

                const password = localStorage.getItem('password');

                if (!username || !password) {
                    alert('Please log in to submit a bid.');
                    return;
                }

                const bidData = {
                    amount: bidAmount,
                    carVin: index,
                    bidderUserName: username
                };

                return fetch(`http://127.0.0.1:8080/bids/new/${username}/${password}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(bidData),
                });
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to submit bid.');
                }
                return response.json();
            })
            .then(data => {
                alert('Bid submitted successfully: $' + bidAmount);
                closeBidModal();
                // Optionally reload the page to update the bid history
                window.location.reload();
            })
            .catch(error => {
                console.error('Error submitting bid:', error);
                alert('Failed to submit bid. Please try again later.');
            });
    }

    // Function to end the auction and mark as sold
    function endAuction() {
        const username = localStorage.getItem('username');
        const password = localStorage.getItem('password');

        if (!username || !password) {
            alert('Please log in to end the auction.');
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const index = urlParams.get('vin');

        fetch(`http://127.0.0.1:8080/cars/vin/${index}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(car => {
                const carData = car.body.data;
                const lastBid = carData.bidHistory ? carData.bidHistory[carData.bidHistory.length - 1] : null;

                if (lastBid) {
                    const lastBidderName = lastBid.bidder.name;
                    const lastBidAmount = lastBid.amount;

                    const confirmMessage = `Are you sure you want to end the auction and sell it to ${lastBidderName} for $${lastBidAmount}?`;

                    if (window.confirm(confirmMessage)) {
                        return fetch(`http://127.0.0.1:8080/cars/sell/${index}/${username}/${password}`, {
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        });
                    }
                } else {
                    alert('No bids available to end the auction.');
                }
            })
            .then(response => {
                if (response && !response.ok) {
                    throw new Error('Failed to end the auction.');
                }
                if (response) {
                    return response.json();
                }
            })
            .then(data => {
                if (data) {
                    alert('Auction ended and car marked as sold.');
                    // Optionally reload the page to update the status
                    window.location.reload();
                }
            })
            .catch(error => {
                console.error('Error ending auction:', error);
                alert('Failed to end the auction. Please try again later.');
            });
    }

    document.getElementById('make-bid').addEventListener('click', showBidModal);
    document.getElementsByClassName('close')[0].addEventListener('click', closeBidModal);
    document.getElementById('bidForm').addEventListener('submit', function(event) {
        event.preventDefault();
        submitBid();
    });

    const urlParams = new URLSearchParams(window.location.search);
    const index = urlParams.get('vin');

    fetch(`http://127.0.0.1:8080/cars/vin/${index}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(car => {
            const carData = car.body.data;
            document.getElementById('car-image').src = carData.image;
            document.getElementById('make').innerText = `Manufacturer: ${carData.make}`;
            document.getElementById('model').innerText = `Model: ${carData.model}`;
            document.getElementById('year').innerText = `Year: ${carData.year}`;
            document.getElementById('price').innerText = `Current bid: $${carData.price}`;
            document.getElementById('description').innerText = carData.description;

            const username = localStorage.getItem('username');
            const endAuctionButton = document.getElementById('end-auction');
            const makeBidButton = document.getElementById('make-bid');

            if (carData.lister.username === username) {
                endAuctionButton.style.display = 'inline-block';

                if (carData.carStatus !== 'SOLD') {
                    endAuctionButton.disabled = true;
                    endAuctionButton.style.backgroundColor = 'grey';
                } else {
                    endAuctionButton.addEventListener('click', endAuction);
                }
            }

            if (carData.carStatus === 'ACTIVE') {
                makeBidButton.disabled = false;
                makeBidButton.style.backgroundColor = '';
            } else {
                makeBidButton.disabled = true;
                makeBidButton.style.backgroundColor = 'grey';
            }

            makeBidButton.style.display = 'inline-block';

            const bidTableBody = document.getElementById('bid-table-body');
            if (carData.bidHistory && Array.isArray(carData.bidHistory)) {
                carData.bidHistory.forEach(bid => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${bid.bidder.name}</td>
                        <td>$${bid.amount}</td>
                        <td>${new Date(bid.date).toLocaleString()}</td>
                    `;
                    bidTableBody.appendChild(row);
                });
            } else {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="3">No bid history available</td>';
                bidTableBody.appendChild(row);
            }
        })
        .catch(error => {
            console.error('Error fetching car details:', error);
        });
});