document.getElementById('checkButton').addEventListener('click', async () => {
    const licenseKey = document.getElementById('licenseKey').value.trim();
    const resultDiv = document.getElementById('result');
    resultDiv.className = 'result'; // Reset classes

    if (!licenseKey) {
        resultDiv.innerHTML = 'Please enter a license key.';
        resultDiv.classList.add('error');
        return;
    }

    // Use the same API URL as in your config.lua
    const apiUrl = 'https://muffinv.vercel.app/api/check-license'; // Ensure this matches your deployment

    try {
        resultDiv.innerHTML = 'Checking...';
        resultDiv.classList.add('info');

        const response = await fetch(`<span class="math-inline">\{apiUrl\}?key\=</span>{licenseKey}`);
        const data = await response.json();

        if (data.status === 'valid') {
            let message = 'License is VALID!';
            if (data.expires) {
                const expiresDate = new Date(data.expires);
                const now = new Date();
                const diffTime = expiresDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays > 0) {
                    message += ` Remaining days: ${diffDays}.`;
                } else {
                    message += ` (Expires today or already expired, but still marked as valid)`; // This case shouldn't ideally happen with 'valid' status
                }
            } else {
                message += ' (Unlimited duration).';
            }
            resultDiv.innerHTML = message;
            resultDiv.classList.add('success');
        } else if (data.status === 'expired') {
            resultDiv.innerHTML = `License EXPIRED: ${data.message}`;
            resultDiv.classList.add('error');
        } else if (data.status === 'invalid') {
            resultDiv.innerHTML = `License INVALID: ${data.message}`;
            resultDiv.classList.add('error');
        } else {
            resultDiv.innerHTML = `Error: ${data.message || 'Unknown status'}`;
            resultDiv.classList.add('error');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        resultDiv.innerHTML = 'An error occurred while checking the license. Please try again later.';
        resultDiv.classList.add('error');
    }
});