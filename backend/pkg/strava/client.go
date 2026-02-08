package strava

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

const (
	baseURL      = "https://www.strava.com/api/v3"
	authURL      = "https://www.strava.com/oauth/authorize"
	tokenURL     = "https://www.strava.com/oauth/token"
	scope        = "read,activity:read_all,profile:read_all"
)

// Client handles Strava API communication
type Client struct {
	ClientID     string
	ClientSecret string
	RedirectURI  string
	HTTPClient   *http.Client
}

// NewClient creates a new Strava API client
func NewClient(clientID, clientSecret, redirectURI string) *Client {
	return &Client{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURI:  redirectURI,
		HTTPClient:   &http.Client{Timeout: 10 * time.Second},
	}
}

// TokenResponse represents the OAuth token response
type TokenResponse struct {
	TokenType    string `json:"token_type"`
	AccessToken  string `json:"access_token"`
	ExpiresAt    int64  `json:"expires_at"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token"`
	Athlete      struct {
		ID        int64  `json:"id"`
		Username  string `json:"username"`
		FirstName string `json:"firstname"`
		LastName  string `json:"lastname"`
	} `json:"athlete"`
}

// GetAuthorizationURL returns the URL to redirect users to for Strava OAuth
func (c *Client) GetAuthorizationURL(state string) string {
	params := url.Values{}
	params.Add("client_id", c.ClientID)
	params.Add("response_type", "code")
	params.Add("redirect_uri", c.RedirectURI)
	params.Add("approval_prompt", "force")
	params.Add("scope", scope)
	if state != "" {
		params.Add("state", state)
	}

	return fmt.Sprintf("%s?%s", authURL, params.Encode())
}

// ExchangeToken exchanges the authorization code for an access token
func (c *Client) ExchangeToken(code string) (*TokenResponse, error) {
	params := url.Values{}
	params.Add("client_id", c.ClientID)
	params.Add("client_secret", c.ClientSecret)
	params.Add("code", code)
	params.Add("grant_type", "authorization_code")

	resp, err := c.HTTPClient.PostForm(tokenURL, params)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("strava api returned status: %d", resp.StatusCode)
	}

	var tokenResp TokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return nil, err
	}

	return &tokenResp, nil
}

// Activity represents a Strava activity response
type Activity struct {
	ID                 int64   `json:"id"`
	Name               string  `json:"name"`
	Distance           float64 `json:"distance"`           // meters
	MovingTime         int     `json:"moving_time"`        // seconds
	ElapsedTime        int     `json:"elapsed_time"`       // seconds
	TotalElevationGain float64 `json:"total_elevation_gain"` // meters
	Type               string  `json:"type"`               // "Run", "Ride", etc.
	StartDate          string  `json:"start_date"`         // ISO 8601 format
	AverageHeartrate   float64 `json:"average_heartrate"`
	MaxHeartrate       float64 `json:"max_heartrate"`
}

// GetActivities fetches recent activities for the authenticated athlete
func (c *Client) GetActivities(accessToken string, page int, perPage int) ([]Activity, error) {
	if perPage == 0 {
		perPage = 30
	}
	if page == 0 {
		page = 1
	}

	url := fmt.Sprintf("%s/athlete/activities?page=%d&per_page=%d", baseURL, page, perPage)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("strava api returned status: %d", resp.StatusCode)
	}

	var activities []Activity
	if err := json.NewDecoder(resp.Body).Decode(&activities); err != nil {
		return nil, err
	}

	return activities, nil
}

// RefreshToken refreshes an expired access token
func (c *Client) RefreshToken(refreshToken string) (*TokenResponse, error) {
	params := url.Values{}
	params.Add("client_id", c.ClientID)
	params.Add("client_secret", c.ClientSecret)
	params.Add("refresh_token", refreshToken)
	params.Add("grant_type", "refresh_token")

	resp, err := c.HTTPClient.PostForm(tokenURL, params)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("strava api returned status: %d", resp.StatusCode)
	}

	var tokenResp TokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return nil, err
	}

	return &tokenResp, nil
}
