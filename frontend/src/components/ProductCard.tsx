import React from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Chip,
  Rating,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import VisibilityIcon from "@mui/icons-material/Visibility";

const StyledCard = styled(Card)(() => ({
  borderRadius: 16,
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  transition: "all 0.3s ease-in-out",
  position: "relative",
  overflow: "visible",
  "&:hover": {
    transform: "translateY(-8px)",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },
}));

const StyledCardMedia = styled(CardMedia)(() => ({
  height: 200,
  position: "relative",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(45deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 100%)",
    zIndex: 1,
  },
}));

const ActionButtons = styled(Box)(() => ({
  position: "absolute",
  top: 12,
  right: 12,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  zIndex: 2,
  opacity: 0,
  transform: "translateX(20px)",
  transition: "all 0.3s ease-in-out",
  "& .MuiIconButton-root": {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(10px)",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 1)",
      transform: "scale(1.1)",
    },
  },
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(2),
  "&:last-child": {
    paddingBottom: theme.spacing(2),
  },
}));

const PriceTag = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 12,
  left: 12,
  backgroundColor: theme.palette.primary.main,
  color: "#fff",
  padding: "4px 12px",
  borderRadius: 20,
  fontSize: "0.875rem",
  fontWeight: 600,
  zIndex: 2,
}));

interface ProductCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  rating: number;
  category: string;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
  onAddToCart?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  title,
  description,
  price,
  image,
  rating,
  category,
  isFavorite = false,
  onFavoriteToggle,
  onAddToCart,
  onViewDetails,
}) => {
  return (
    <StyledCard>
      <Box sx={{ position: "relative" }}>
        <StyledCardMedia
          image={image}
          title={title}
        />
        <PriceTag>
          ฿{price.toLocaleString()}
        </PriceTag>
        <ActionButtons className="action-buttons">
          <IconButton
            size="small"
            onClick={() => onViewDetails?.(id)}
            sx={{ color: "primary.main" }}
          >
            <VisibilityIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onFavoriteToggle?.(id)}
            sx={{ color: isFavorite ? "error.main" : "grey.500" }}
          >
            {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
        </ActionButtons>
      </Box>

      <StyledCardContent>
        <Box sx={{ mb: 1 }}>
          <Chip
            label={category}
            size="small"
            sx={{
              backgroundColor: "rgba(25, 118, 210, 0.1)",
              color: "primary.main",
              fontSize: "0.75rem",
            }}
          />
        </Box>

        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontWeight: 600,
            mb: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            lineHeight: 1.3,
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            lineHeight: 1.4,
          }}
        >
          {description}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Rating
            value={rating}
            precision={0.5}
            size="small"
            readOnly
            sx={{ mr: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            ({rating})
          </Typography>
        </Box>

        <Button
          variant="contained"
          fullWidth
          startIcon={<ShoppingCartIcon />}
          onClick={() => onAddToCart?.(id)}
          sx={{
            borderRadius: 8,
            textTransform: "none",
            fontWeight: 600,
            background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: "0 4px 12px rgba(25, 118, 210, 0.4)",
            },
          }}
        >
          Add to Cart
        </Button>
      </StyledCardContent>
    </StyledCard>
  );
};

export default ProductCard;
