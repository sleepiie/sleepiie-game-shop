package main

import (
	"fmt"
	"log"
	"os"

	"github.com/sleepiie/sleepiie-game-shop/internal/application"
	"github.com/sleepiie/sleepiie-game-shop/internal/domain"
	"github.com/sleepiie/sleepiie-game-shop/internal/infrastructure/database"
	handler "github.com/sleepiie/sleepiie-game-shop/internal/infrastructure/http"

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

	db.AutoMigrate(&domain.Game{}, &domain.GameKey{}, &domain.User{})

	gameRepo := database.NewGameRepository(db)
	gameService := application.NewGameService(gameRepo)
	gameHandler := handler.NewGameHandler(gameService)

	userRepo := database.NewUserRepository(db)
	authService := application.NewAuthService(userRepo)
	authHandler := handler.NewAuthHandler(authService)

	r := gin.Default()

	api := r.Group("/api")
	{
		api.GET("/games", gameHandler.GetGames)
		api.POST("/register", authHandler.Register)
		api.POST("/login", authHandler.Login)

		protected := api.Group("/")
		protected.Use(handler.AuthMiddleware())
		{
			// protect route
		}

		admin := api.Group("/admin")
		admin.Use(handler.AuthMiddleware(), handler.AdminMiddleware())
		{
			// admin route test
			admin.GET("/test", func(c *gin.Context) {
				c.JSON(200, gin.H{"message": "Welcome, Admin!"})
			})
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
