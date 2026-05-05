import React from "react";
import {
  Paper,
  Typography,
  Box,
  Divider,
  Chip,
  IconButton,
  Collapse,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

const StyledPaper = styled(Paper)(() => ({
  borderRadius: 16,
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  background: "rgba(255, 255, 255, 0.95)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  overflow: "hidden",
  transition: "all 0.3s ease-in-out",
  "&:hover": {
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  },
  marginBottom: "10px",
}));

const FormHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  "& .MuiTypography-root": {
    fontWeight: 600,
  },
}));

const FormContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(2),
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const FieldGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(3),
  "& > *": {
    flex: "1 1 calc(50% - 8px)",
    minWidth: 250,
  },
  "& .full-width": {
    flex: "1 1 100%",
  },
}));

interface FormContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  badge?: string;
  badgeColor?: "primary" | "secondary" | "error" | "warning" | "info" | "success";
  maxWidth?: number | string;
  elevation?: number;
}

const FormContainer = React.forwardRef<HTMLDivElement, FormContainerProps>(({
  title,
  subtitle,
  children,
  collapsible = false,
  defaultExpanded = true,
  badge,
  badgeColor = "primary",
  maxWidth = "100%",
  elevation = 0,
}, ref) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <StyledPaper ref={ref} elevation={elevation} sx={{ maxWidth }}>
      <FormHeader>
        <Box>
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {badge && (
            <Chip
              label={badge}
              color={badgeColor}
              size="small"
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "#fff",
                border: "1px solid rgba(255, 255, 255, 0.3)",
              }}
            />
          )}
          {collapsible && (
            <IconButton
              onClick={handleToggle}
              sx={{ color: "#fff" }}
              size="small"
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </Box>
      </FormHeader>
      
      <Collapse in={expanded}>
        <FormContent>
          {children}
        </FormContent>
      </Collapse>
    </StyledPaper>
  );
});

FormContainer.displayName = 'FormContainer';

// Sub-components for better organization
const FormSection: React.FC<{
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <Box sx={{ mb: 4 }}>
    <SectionTitle variant="h6">
      {icon}
      {title}
    </SectionTitle>
    <Divider sx={{ mb: 2 }} />
    {children}
  </Box>
);

const FormFieldGroup = FieldGroup;

const FormFullWidth = styled(Box)({
  width: "100%",
});

// Attach sub-components
(FormContainer as any).Section = FormSection;
(FormContainer as any).FieldGroup = FormFieldGroup;
(FormContainer as any).FullWidth = FormFullWidth;

export default FormContainer; 