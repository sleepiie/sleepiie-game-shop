package http

import (
	"net/http"
	"strconv"

	"github.com/sleepiie/sleepiie-game-shop/internal/domain"

	"github.com/gin-gonic/gin"
)

type GameHandler struct {
	service domain.GameService
}

func NewGameHandler(service domain.GameService) *GameHandler {
	return &GameHandler{service: service}
}

func (h *GameHandler) GetGames(c *gin.Context) {
	search := c.Query("search")
	platform := c.Query("platform")

	games, err := h.service.GetGamesList(search, platform)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch games"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": games})
}

func (h *GameHandler) GetGameByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid game ID format"})
		return
	}

	game, err := h.service.GetGameByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, game)
}

func (h *GameHandler) CreateGame(c *gin.Context) {
	var req domain.CreateGameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	game, err := h.service.CreateGame(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create game"})
		return
	}

	c.JSON(http.StatusCreated, game)
}

func (h *GameHandler) DeleteGame(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid game ID format"})
		return
	}

	if err := h.service.DeleteGame(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete game"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Game deleted successfully"})
}

func (h *GameHandler) AddGameKeys(c *gin.Context) {
	idParam := c.Param("id")
	gameID, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid game ID format"})
		return
	}

	var req domain.AddGameKeysRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.AddGameKeys(uint(gameID), req.Keys); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add game keys"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Keys added successfully"})
}
