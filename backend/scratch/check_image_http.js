const axios = require('axios');

async function check() {
    try {
        const urls = [
            'http://localhost:5000/uploads/products/prod_664c7e6b000000000000003f_main.jpg',
            'http://localhost:5000/uploads/products/prod_664c7e6b000000000000003f_sub_0.jpg',
            'http://localhost:5000/uploads/products/prod_664c7e6b000000000000003f_sub_1.jpg',
            'http://localhost:5000/uploads/products/prod_664c7e6b000000000000003f_sub_2.jpg'
        ];

        for (const url of urls) {
            const res = await axios.head(url);
            console.log(`${url} -> status: ${res.status}, content-length: ${res.headers['content-length']}, content-type: ${res.headers['content-type']}`);
        }
    } catch (err) {
        console.error(err.message);
    }
}

check();
