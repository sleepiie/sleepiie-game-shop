package database

import (
	"errors"
	"strconv"

	"github.com/sleepiie/sleepiie-game-shop/internal/domain"

	"gorm.io/gorm"
)

type orderRepository struct {
	db *gorm.DB
}

func NewOrderRepository(db *gorm.DB) domain.OrderRepository {
	return &orderRepository{db: db}
}

func (r *orderRepository) CheckStockAndCalculateTotal(gameIDs []uint) (float64, []domain.OrderItem, error) {
	var totalAmount float64
	var items []domain.OrderItem

	err := r.db.Transaction(func(tx *gorm.DB) error {
		for _, gameID := range gameIDs {
			var game domain.Game
			if err := tx.First(&game, gameID).Error; err != nil {
				return errors.New("game not found")
			}

			var count int64
			tx.Model(&domain.GameKey{}).Where("game_id = ? AND is_used = ?", gameID, false).Count(&count)
			if count == 0 {
				return errors.New("out of stock for game: " + game.Title)
			}

			totalAmount += game.Price
			items = append(items, domain.OrderItem{GameID: gameID, Price: game.Price})
		}
		return nil
	})

	return totalAmount, items, err
}

func (r *orderRepository) CreateOrder(order *domain.Order) error {
	return r.db.Create(order).Error
}

func (r *orderRepository) GetHistory(userID uint) ([]domain.Order, error) {
	var orders []domain.Order
	err := r.db.Preload("Items").Preload("Keys").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&orders).Error
	return orders, err
}

func (r *orderRepository) ProcessPaymentSuccess(paymentIntentID string) (*domain.Order, error) {
	var order domain.Order
	err := r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("payment_intent = ?", paymentIntentID).Preload("Items").First(&order).Error; err != nil {
			return err
		}

		if order.Status == "paid" {
			return nil
		}

		order.Status = "paid"
		if err := tx.Save(&order).Error; err != nil {
			return err
		}

		for _, item := range order.Items {
			var key domain.GameKey
			if err := tx.Raw("SELECT id FROM game_keys WHERE game_id = ? AND is_used = false LIMIT 1 FOR UPDATE SKIP LOCKED", item.GameID).Scan(&key.ID).Error; err != nil {
				return errors.New("insufficient game keys for game_id: " + strconv.Itoa(int(item.GameID)))
			}
			tx.Model(&domain.GameKey{}).Where("id = ?", key.ID).Updates(map[string]interface{}{
				"is_used":  true,
				"order_id": order.ID,
			})
		}
		return nil
	})
	return &order, err
}

func (r *orderRepository) GetAllOrders() ([]domain.Order, error) {
	var orders []domain.Order
	err := r.db.Preload("Items").Preload("Keys").Order("created_at DESC").Find(&orders).Error
	return orders, err
}

func (r *orderRepository) GetRevenueSummary() (float64, int64, []domain.DailyRevenue, error) {
	var totalRevenue float64
	var totalOrders int64
	var dailyRevenue []domain.DailyRevenue

	err := r.db.Model(&domain.Order{}).Where("status = ?", "paid").Select("COALESCE(SUM(total_amount), 0)").Scan(&totalRevenue).Error
	if err != nil {
		return 0, 0, nil, err
	}

	err = r.db.Model(&domain.Order{}).Where("status = ?", "paid").Count(&totalOrders).Error
	if err != nil {
		return 0, 0, nil, err
	}

	err = r.db.Model(&domain.Order{}).
		Select("DATE(created_at)::text as date, SUM(total_amount) as revenue").
		Where("status = ?", "paid").
		Group("DATE(created_at)").
		Order("DATE(created_at) ASC").
		Scan(&dailyRevenue).Error

	if err != nil {
		return 0, 0, nil, err
	}

	return totalRevenue, totalOrders, dailyRevenue, nil
}

func (r *orderRepository) CancelOrder(orderID uint) error {
	return r.db.Model(&domain.Order{}).Where("id = ? AND status = ?", orderID, "pending").Update("status", "failed").Error
}

func (r *orderRepository) ProcessPaymentFailure(paymentIntentID string) error {
	return r.db.Model(&domain.Order{}).Where("payment_intent = ? AND status = ?", paymentIntentID, "pending").Update("status", "failed").Error
}
