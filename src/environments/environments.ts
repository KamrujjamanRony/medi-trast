export const environment = {
    production: false,
    // Admin panel credential. The password itself is NEVER stored here; only a
    // PBKDF2-SHA256 salt + hash, which are useless without the password.
    // Regenerate with: node tools/generate-admin-hash.mjs "your new password"
    adminAuth: {
    "salt": "b18bb49386df6e3c9d81ba628b2e085a",
    "hash": "7c36b81d268ba4ba1cf059c3e24279910575c79f7427271f681b6543e18990ec",
    "iterations": 310000
    },
    companyCode: 1,
    location: 'MEDI-TRUST ENGINEERS, 7th Floor, Block-B, Mirpur Tower, Darus Salam Road, Mirpur-1, Dhaka-1216',
    ProductApi: 'https://mec.supersoftbd.com/apiA/Product',
    CarouselApi: 'https://mec.supersoftbd.com/apiA/Carousel',
    AboutApi: 'https://mec.supersoftbd.com/apiA/AboutUs',
    ContactApi: 'https://mec.supersoftbd.com/apiA/Address',
    ImageApi: 'https://mec.supersoftbd.com/Images/',
    emptyImg: 'assets/no-image.svg',
};
