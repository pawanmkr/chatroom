package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/gorilla/websocket"
)

var ugrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins (not secure, but okay for basic setup)
		return true
	},
}
var active_users = struct {
	connections map[string]*websocket.Conn
	mu sync.Mutex
}{
	connections: make(map[string]*websocket.Conn),
}

type Message struct {
	From    string    `json:"from"`
	To      string    `json:"to"`
	Content string    `json:"content"`
	Time    time.Time `json:"time"`
}

func main() {
	r := chi.NewRouter()

	// middlewares
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(corsMiddleware)

	r.Group(func(r chi.Router) {
		r.Use(middleware.Timeout(60 * time.Second))
		r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte("i'm healthy duckboi"))
		})
		r.Get("/user/active", getActiveUsers)
		r.Post("/send_message", handleSendMessage)
	})
	r.Get("/ws/{user_id}", handleWebsocket)

	// Start the server
	fmt.Println("[SERVER]: listening on :8000")
	http.ListenAndServe(":8000", r)
}

// CORS Middleware
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Allow any origin (adjust as needed for your application)
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		// Handle preflight requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func handleWebsocket(w http.ResponseWriter, r *http.Request) {
	// get user_id from url (path-param)
	user_id := chi.URLParam(r, "user_id")
	if user_id == "" {
		http.Error(w, "missing user_id", http.StatusBadRequest)
		return
	}

	// Upgrade the HTTP connection to a WebSocket
	conn, err := ugrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, "could not upgrade to ws connection", http.StatusInternalServerError)
		return
	}
	defer conn.Close()

	// Safely add the connection
	active_users.mu.Lock()
	active_users.connections[user_id] = conn
	active_users.mu.Unlock()
	fmt.Printf("user connected: %s\n", user_id)

	broadcastUserUpdate("user_joined", user_id)

	// listen for messages from the client
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			fmt.Printf("error reading message from %s: %v\n", user_id, err)
			break
		}
		// handle incoming message
		var message Message
		err = json.Unmarshal(msg, &message)
		if err != nil {
			fmt.Printf("Invalid message format from %s: %v\n", user_id, err)
			continue
		}
		message.Time = time.Now()
		sendMessageToRecipient(message)
	}
	// Safely remove the connection
	active_users.mu.Lock()
	delete(active_users.connections, user_id)
	active_users.mu.Unlock()
	fmt.Printf("user disconnected: %s\n", user_id)

	broadcastUserUpdate("user_left", user_id)
}

func broadcastUserUpdate(event, user_id string) {
	active_users.mu.Lock()
	defer active_users.mu.Unlock()

	msg := map[string]string{
		"event":   event,
		"user_id": user_id,
	}
	msgBytes, _ := json.Marshal(msg)

	for _, conn := range active_users.connections {
		// Prevent panic by handling individual errors
		go func(c *websocket.Conn) {
			active_users.mu.Lock()
			defer active_users.mu.Unlock()
			err := c.WriteMessage(websocket.TextMessage, msgBytes)
			if err != nil {
				fmt.Printf("error writing to websocket: %v\n", err)
			}
		}(conn)
	}
}

func handleSendMessage(w http.ResponseWriter, r *http.Request) {
	content := r.FormValue("content")
	userID := r.URL.Query().Get("user_id")
	message := Message{
		From:    userID,
		To:      userID,
		Content: content,
		Time:    time.Now(),
	}
	sendMessageToRecipient(message)

	// Return the response as JSON to update the chat window
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": message.Content,
		"time":    message.Time.Format(time.RFC3339),
	})
}

// send message to a specific user
func sendMessageToRecipient(msg Message) {
	conn, ok := active_users.connections[msg.To]
	if !ok {
		fmt.Printf("%s is not connected. cannot deliver message.\n", msg.To)
		return
	}
	messageBytes, _ := json.Marshal(msg)
	err := conn.WriteMessage(websocket.TextMessage, messageBytes)
	if err != nil {
		fmt.Printf("error sending message to %s: %v\n", msg.To, err)
	}
}

func getActiveUsers(w http.ResponseWriter, r *http.Request) {
	// Get the list of active users
	activeUsers := []string{}
	for user := range active_users.connections {
		activeUsers = append(activeUsers, user)
	}

	// Return the active users as JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	err := json.NewEncoder(w).Encode(map[string]interface{}{
		"active_users": activeUsers,
	})
	if err != nil {
		http.Error(w, "error encoding JSON", http.StatusInternalServerError)
		return
	}
}
