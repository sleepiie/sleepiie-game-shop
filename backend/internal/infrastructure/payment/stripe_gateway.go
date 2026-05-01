package payment

import (
	"os"

	"github.com/sleepiie/sleepiie-game-shop/internal/domain"

	"github.com/stripe/stripe-go/v78"
	"github.com/stripe/stripe-go/v78/paymentintent"
)

type stripeGateway struct{}

func NewStripeGateway() domain.PaymentGateway {
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
	return &stripeGateway{}
}

func (g *stripeGateway) CreatePromptPayPayment(amount float64) (*domain.PaymentIntent, error) {
	params := &stripe.PaymentIntentParams{
		Amount:             stripe.Int64(int64(amount * 100)),
		Currency:           stripe.String(string(stripe.CurrencyTHB)),
		PaymentMethodTypes: stripe.StringSlice([]string{"promptpay"}),
	}

	pi, err := paymentintent.New(params)
	if err != nil {
		return nil, err
	}

	return &domain.PaymentIntent{
		ID:           pi.ID,
		ClientSecret: pi.ClientSecret,
	}, nil
}
