export interface UpdateProductRequest {
    CompanyID: number;
    ProductCategory: string,
    ProductName: string,
    Brand: string,
    Model: string,
    Origin: string,
    Description: string,
    AditionalInformation: string,
    SpecialFeature: string,
    CatalogUr: string,
    ImageUrl: string;
    ImageFormFile: File | null;
}