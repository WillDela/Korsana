package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

// Pagination defaults and caps shared across list endpoints. The cap exists
// to keep a single request from pulling unbounded rows when a caller passes
// a large `per_page` — accidentally or otherwise.
const (
	DefaultPageSize = 50
	MaxPageSize     = 200
)

// Pagination parses ?page=&per_page= from the request, clamping per_page to
// [1, MaxPageSize] and page to >= 1. Invalid input falls back to defaults
// silently — list endpoints prefer "return something sensible" over 400s on
// pagination params.
type Pagination struct {
	Page    int
	PerPage int
	Offset  int
}

func ParsePagination(c *gin.Context) Pagination {
	return ParsePaginationWithDefault(c, DefaultPageSize)
}

func ParsePaginationWithDefault(c *gin.Context, defaultPerPage int) Pagination {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", strconv.Itoa(defaultPerPage)))
	if perPage < 1 {
		perPage = defaultPerPage
	}
	if perPage > MaxPageSize {
		perPage = MaxPageSize
	}
	return Pagination{
		Page:    page,
		PerPage: perPage,
		Offset:  (page - 1) * perPage,
	}
}
