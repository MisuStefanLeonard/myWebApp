
    function block(button) {
        var userId = button.getAttribute('data-id');
        fetch('/block_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: userId }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
           
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }
    
    function unblock(button) {
        var userId = button.getAttribute('data-id');
        fetch('/unblock_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: userId }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }
