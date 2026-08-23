export const environment = {
    production: true,
    // Admin panel credential. The password itself is NEVER stored here; only a
    // PBKDF2-SHA256 salt + hash, which are useless without the password.
    // Regenerate with: node tools/generate-admin-hash.mjs "your new password"
    adminAuth: {
        salt: '5a56c9edb569b3f002eb2565ede25b2c',
        hash: 'd1bb91d93a3fa62d305880626d1237ebd6e7da8a7406e1fe4616aa7795358622',
        iterations: 310000,
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