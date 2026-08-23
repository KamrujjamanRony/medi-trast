export interface CarouselModel {
    id: string;
    companyID: number;
    title: string;
    description: string;
    imageUrl: string;
    imageFile: File | null;
}

export interface AddCarouselRequest {
    companyID: number;
    title: string;
    description: string;
    imageUrl: string;
    imageFile: File | null;
}

export interface UpdateCarouselRequest {
    companyID: number;
    title: string;
    description: string;
    imageUrl: string;
    imageFile: File | null;
}

