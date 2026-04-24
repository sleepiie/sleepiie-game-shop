package database

import (
	"errors"

	"github.com/sleepiie/sleepiie-game-shop/internal/domain"
	"gorm.io/gorm"
)

type cartRepository struct {
	db *gorm.DB
}

func NewCartRepository(db *gorm.DB) domain.CartRepository {
	return &cartRepository{db: db}
}

func (r *cartRepository) AddItem(item *domain.CartItem) error {
	return r.db.Create(item).Error
}

func (r *cartRepository) GetItemsByUserID(userID uint) ([]domain.CartItem, error) {
	var items []domain.CartItem
	err := r.db.Preload("Game").Where("user_id = ?", userID).Find(&items).Error
	return items, err
}

func (r *cartRepository) GetItemByUserIDAndGameID(userID uint, gameID uint) (*domain.CartItem, error) {
	var item domain.CartItem
	err := r.db.Where("user_id = ? AND game_id = ?", userID, gameID).First(&item).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &item, nil
}

func (r *cartRepository) RemoveItem(userID uint, gameID uint) error {
	return r.db.Where("user_id = ? AND game_id = ?", userID, gameID).Delete(&domain.CartItem{}).Error
}

func (r *cartRepository) ClearCart(userID uint) error {
	return r.db.Where("user_id = ?", userID).Delete(&domain.CartItem{}).Error
}
