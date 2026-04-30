package main

import (
	"fmt"
	"log"
	"os"

	"github.com/sleepiie/sleepiie-game-shop/internal/application"
	"github.com/sleepiie/sleepiie-game-shop/internal/domain"
	"github.com/sleepiie/sleepiie-game-shop/internal/infrastructure/database"
	handler "github.com/sleepiie/sleepiie-game-shop/internal/infrastructure/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		os.Getenv("POSTGRES_HOST"),
		os.Getenv("POSTGRES_USER"),
		os.Getenv("POSTGRES_PASSWORD"),
		os.Getenv("POSTGRES_DB"),
		os.Getenv("POSTGRES_PORT"),
	)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	db.AutoMigrate(&domain.Order{}, &domain.OrderItem{}, &domain.Game{}, &domain.GameKey{}, &domain.User{}, &domain.CartItem{})

	gameRepo := database.NewGameRepository(db)
	gameService := application.NewGameService(gameRepo)
	gameHandler := handler.NewGameHandler(gameService)

	userRepo := database.NewUserRepository(db)
	emailService := application.NewEmailService()
	authService := application.NewAuthService(userRepo, emailService)
	authHandler := handler.NewAuthHandler(authService)

	cartRepo := database.NewCartRepository(db)
	cartService := application.NewCartService(cartRepo, gameRepo)
	cartHandler := handler.NewCartHandler(cartService)

	orderRepo := database.NewOrderRepository(db)
	orderService := application.NewOrderService(orderRepo, cartService)
	orderHandler := handler.NewOrderHandler(orderService)

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	api := r.Group("/api")
	{
		api.GET("/games", gameHandler.GetGames)
		api.POST("/register", authHandler.Register)
		api.POST("/login", authHandler.Login)
		api.POST("/forgot-password", authHandler.ForgotPassword)
		api.POST("/reset-password", authHandler.ResetPassword)
		api.POST("/webhook", orderHandler.StripeWebhook)

		protected := api.Group("/")
		protected.Use(handler.AuthMiddleware())
		{
			protected.GET("/profile", authHandler.GetProfile)
			protected.PUT("/profile", authHandler.UpdateProfile)
			protected.GET("/cart", cartHandler.GetCart)
			protected.POST("/cart", cartHandler.AddToCart)
			protected.DELETE("/cart/:id", cartHandler.RemoveFromCart)
			protected.POST("/checkout", orderHandler.Checkout)
			protected.GET("/orders", orderHandler.GetHistory)
		}

		admin := api.Group("/admin")
		admin.Use(handler.AuthMiddleware(), handler.AdminMiddleware())
		{

			admin.POST("/games", gameHandler.CreateGame)
			admin.DELETE("/games/:id", gameHandler.DeleteGame)
			admin.POST("/games/:id/keys", gameHandler.AddGameKeys)

			admin.GET("/orders", orderHandler.GetAllOrders)
			admin.POST("/orders/:id/cancel", orderHandler.CancelOrder)
			admin.GET("/revenue", orderHandler.GetRevenueSummary)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
