export interface ReviewUser {
  _id: string;
  name: string;
  avatar: string | null;
}

export interface Review {
  _id: string;
  user: ReviewUser;
  event: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  distribution: Array<{ rating: number; count: number }>;
}

export interface ReviewListData {
  reviews: Review[];
  myReview: Review | null;
  eligibility: {
    canReview: boolean;
    reason:
      | "eligible"
      | "not_authenticated"
      | "not_attendee"
      | "not_registered"
      | "event_not_ended"
      | "already_reviewed";
  };
  summary: ReviewSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
