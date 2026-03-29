export interface Review {
    id: string;
    rating: number;
    title?: string;
    text?: string;
    aiReply?: string;
    userName: string;
    isVerifiedPurchase: boolean;
    createdAt: string;
  }
  
  export interface ReviewsResponse {
    reviews: Review[];
    avgRating: number;
    totalReviews: number;
    ratingBreakdown: Record<string, number>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }
  
  export interface SubmitReviewPayload {
    productId: string;
    rating: number;
    title?: string;
    text?: string;
  }