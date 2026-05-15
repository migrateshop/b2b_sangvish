const axios = require('axios');

async function run() {
    try {
        let res = await axios.post('http://localhost:5000/api/auth/send-otp', {
            email: 'test_supplier@example.com',
            role: 'supplier',
            company_name: 'Test Co'
        });

        res = await axios.post('http://localhost:5000/api/auth/verify-otp', {
            email: 'test_supplier@example.com',
            otp: '123456'
        });

        const token = res.data.token;
        console.log('Token generated');

        // Check if plan exists
        const plansRes = await axios.get('http://localhost:5000/api/subscription-plans');
        const plans = plansRes.data;
        if (plans.length === 0) return console.log('No plans');

        const plan = plans[0];
        console.log('Purchasing:', plan.name);

        const purchaseRes = await axios.post('http://localhost:5000/api/subscription-plans/purchase/' + plan._id, {}, {
            headers: { Authorization: 'Bearer ' + token }
        });
        console.log('Purchase Result:', purchaseRes.data);

        const profileRes = await axios.get('http://localhost:5000/api/auth/profile', {
            headers: { Authorization: 'Bearer ' + token }
        });
        console.log('Profile subscription_plan.name:', profileRes.data.subscription_plan?.name);
    } catch (err) {
        console.error('Error:', err.response?.data || err.message);
    }
}

run();
