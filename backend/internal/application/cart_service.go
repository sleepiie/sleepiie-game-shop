package application

import (
	"errors"

	"github.com/sleepiie/sleepiie-game-shop/internal/domain"
)

type cartService struct {
	cartRepo domain.CartRepository
	gameRepo domain.GameRepository
}

func NewCartService(cartRepo domain.CartRepository, gameRepo domain.GameRepository) domain.CartService {
	return &cartService{
		cartRepo: cartRepo,
		gameRepo: gameRepo,
	}
}

func (s *cartService) AddItem(userID uint, gameID uint) error {
	_, err := s.gameRepo.FindByID(gameID)
	if err != nil {
		return errors.New("game not found")
	}

	existingItem, err := s.cartRepo.GetItemByUserIDAndGameID(userID, gameID)
	if err != nil {
		return err
	}
	if existingItem != nil {
		return errors.New("game is already in your cart")
	}

	item := &domain.CartItem{
		UserID: userID,
		GameID: gameID,
	}
	return s.cartRepo.AddItem(item)
}

func (s *cartService) GetMyCart(userID uint) (domain.CartResponse, error) {
	items, err := s.cartRepo.GetItemsByUserID(userID)
	if err != nil {
		return domain.CartResponse{}, err
	}

	var totalAmount float64
	for _, item := range items {
		totalAmount += item.Game.Price
	}

	return domain.CartResponse{
		Items:       items,
		TotalAmount: totalAmount,
		TotalItems:  len(items),
	}, nil
}

func (s *cartService) RemoveItem(userID uint, gameID uint) error {
	return s.cartRepo.RemoveItem(userID, gameID)
}

func (s *cartService) ClearCart(userID uint) error {
	return s.cartRepo.ClearCart(userID)
}
