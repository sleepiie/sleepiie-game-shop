package http

import (
	"net/http"
	"strconv"

	"github.com/sleepiie/sleepiie-game-shop/internal/domain"

	"github.com/gin-gonic/gin"
)

type CartHandler struct {
	service domain.CartService
}

func NewCartHandler(service domain.CartService) *CartHandler {
	return &CartHandler{service: service}
}

func (h *CartHandler) AddToCart(c *gin.Context) {
	userID := c.MustGet("user_id").(float64) // ดึงจาก JWT Middleware
	var req domain.AddToCartRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	if err := h.service.AddItem(uint(userID), req.GameID); err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Added to cart"})
}

func (h *CartHandler) GetCart(c *gin.Context) {
	userID := c.MustGet("user_id").(float64)

	cart, err := h.service.GetMyCart(uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch cart"})
		return
	}

	c.JSON(http.StatusOK, cart)
}

func (h *CartHandler) RemoveFromCart(c *gin.Context) {
	userID := c.MustGet("user_id").(float64)
	gameIDStr := c.Param("id")
	gameID, _ := strconv.Atoi(gameIDStr)

	h.service.RemoveItem(uint(userID), uint(gameID))
	c.JSON(http.StatusOK, gin.H{"message": "Removed from cart"})
}
