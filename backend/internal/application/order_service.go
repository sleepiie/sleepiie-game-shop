package application

import (
	"os"

	"github.com/sleepiie/sleepiie-game-shop/internal/domain"

	"github.com/stripe/stripe-go/v78"
	"github.com/stripe/stripe-go/v78/paymentintent"
)

type orderService struct {
	repo        domain.OrderRepository
	cartService domain.CartService
}

func NewOrderService(repo domain.OrderRepository, cartService domain.CartService) domain.OrderService {
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
	return &orderService{
		repo:        repo,
		cartService: cartService,
	}
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
			decryptedKey, _ := DecryptKey(key.KeyValue)
			keys = append(keys, domain.OrderKeyResponse{
				GameID:   key.GameID,
				KeyValue: decryptedKey,
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
	order, err := s.repo.ProcessPaymentSuccess(paymentIntentID)
	if err != nil {
		return err
	}

	if order != nil {
		for _, item := range order.Items {
			_ = s.cartService.RemoveItem(order.UserID, item.GameID)
		}
	}

	return nil
}

func (s *orderService) GetAllOrders() ([]domain.OrderHistoryResponse, error) {
	orders, err := s.repo.GetAllOrders()
	if err != nil {
		return nil, err
	}

	var response []domain.OrderHistoryResponse
	for _, order := range orders {
		var keys []domain.OrderKeyResponse
		for _, key := range order.Keys {
			decryptedKey, _ := DecryptKey(key.KeyValue)
			keys = append(keys, domain.OrderKeyResponse{
				GameID:   key.GameID,
				KeyValue: decryptedKey,
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

func (s *orderService) GetRevenueSummary() (*domain.RevenueSummaryResponse, error) {
	totalRevenue, totalOrders, dailyRevenue, err := s.repo.GetRevenueSummary()
	if err != nil {
		return nil, err
	}

	return &domain.RevenueSummaryResponse{
		TotalRevenue: totalRevenue,
		TotalOrders:  totalOrders,
		DailyRevenue: dailyRevenue,
	}, nil
}

func (s *orderService) CancelOrder(orderID uint) error {
	return s.repo.CancelOrder(orderID)
}

func (s *orderService) ProcessPaymentFailure(paymentIntentID string) error {
	return s.repo.ProcessPaymentFailure(paymentIntentID)
}
