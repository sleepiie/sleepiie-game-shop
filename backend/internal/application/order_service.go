package application

import (
	"os"

	"github.com/sleepiie/sleepiie-game-shop/internal/domain"

	"github.com/stripe/stripe-go/v78"
	"github.com/stripe/stripe-go/v78/paymentintent"
)

type orderService struct {
	repo domain.OrderRepository
}

func NewOrderService(repo domain.OrderRepository) domain.OrderService {
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
	return &orderService{repo: repo}
}

func (s *orderService) Checkout(userID uint, req domain.CheckoutRequest) (string, error) {
	totalAmount, items, err := s.repo.CheckStockAndCalculateTotal(req.GameIDs)
	if err != nil {
		return "", err
	}

	params := &stripe.PaymentIntentParams{
		Amount:             stripe.Int64(int64(totalAmount * 100)),
		Currency:           stripe.String(string(stripe.CurrencyTHB)),
		PaymentMethodTypes: stripe.StringSlice([]string{"promptpay"}),
	}
	pi, err := paymentintent.New(params)
	if err != nil {
		return "", err
	}

	order := domain.Order{
		UserID:        userID,
		TotalAmount:   totalAmount,
		PaymentIntent: pi.ID,
		Status:        "pending",
		Items:         items,
	}

	if err := s.repo.CreateOrder(&order); err != nil {
		return "", err
	}

	// ส่ง ClientSecret กลับไปให้ Frontend ดึงไปแสดง QR Code
	return pi.ClientSecret, nil
}

func (s *orderService) GetHistory(userID uint) ([]domain.OrderHistoryResponse, error) {
	orders, err := s.repo.GetHistory(userID)
	if err != nil {
		return nil, err
	}

	var response []domain.OrderHistoryResponse
	for _, order := range orders {
		var keys []domain.OrderKeyResponse
		for _, key := range order.Keys {
			keys = append(keys, domain.OrderKeyResponse{
				GameID:   key.GameID,
				KeyValue: key.KeyValue,
			})
		}

		response = append(response, domain.OrderHistoryResponse{
			ID:          order.ID,
			TotalAmount: order.TotalAmount,
			Status:      order.Status,
			CreatedAt:   order.CreatedAt,
			Items:       order.Items,
			Keys:        keys,
		})
	}

	return response, nil
}

func (s *orderService) ProcessPaymentSuccess(paymentIntentID string) error {
	return s.repo.ProcessPaymentSuccess(paymentIntentID)
}

