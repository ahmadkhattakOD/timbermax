import { Box, Typography, Divider, Grid } from "@mui/material";
import { Form, Formik } from "formik";
import FormInput from "components/FormInput";
import CircularLoader from "components/CircularLoader";
import ActionButton from "components/ActionButton";
import { useEditStock } from "./useEditStock";

// ==============================|| EDIT STOCK PAGE ||============================== //

export default function EditStock() {
  const { validate, onSubmit, stock, loading } = useEditStock();

  if (loading) {
    return (
      <Box
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularLoader />
      </Box>
    );
  }

  if (!stock) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Stock record not found.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Stock info */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          bgcolor: "background.paper",
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Stock Record
        </Typography>
        <Typography variant="body1" fontWeight={600}>
          {stock.item?.name || "Unknown Item"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Warehouse: {stock.warehouse?.name || "Unknown Warehouse"}
        </Typography>
        <Divider sx={{ my: 1.5 }} />
        <Typography variant="body2">
          Current Quantity:{" "}
          <strong>{parseFloat(stock.quantity).toFixed(2)}</strong>
        </Typography>
        {parseFloat(stock.reserved) > 0 && (
          <Typography variant="body2" color="warning.main">
            Reserved: {parseFloat(stock.reserved).toFixed(2)}
          </Typography>
        )}
      </Box>

      <Formik
        enableReinitialize
        initialValues={{
          newQuantity: "",
          notes: "",
          correctQuantity: "",
          reason: "",
        }}
        validate={validate}
        onSubmit={onSubmit}
      >
        {({ handleSubmit, errors, touched, isSubmitting, values }) => (
          <Form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Section 1: Add stock */}
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 2.5,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    height: "100%",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Add Stock
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Adds to the existing quantity. Recorded as a stock-in movement.
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <FormInput
                      id="newQuantity"
                      name="newQuantity"
                      placeholder="Quantity to add"
                      label="Quantity (to add)"
                      type="number"
                      optional={true}
                      error={touched.newQuantity ? errors.newQuantity : ("" as any)}
                    />
                    <FormInput
                      id="notes"
                      name="notes"
                      placeholder="e.g. Purchase Order #12345"
                      label="Notes"
                      type="text"
                      optional={true}
                      error={touched.notes ? errors.notes : ""}
                    />
                  </Box>
                </Box>
              </Grid>

              {/* Divider */}
              <Grid
                item
                xs={12}
                md="auto"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box
                  sx={{
                    display: { xs: "flex", md: "flex" },
                    flexDirection: { xs: "row", md: "column" },
                    alignItems: "center",
                    gap: 1,
                    px: { xs: 0, md: 1 },
                    py: { xs: 1, md: 0 },
                  }}
                >
                  <Divider
                    orientation="horizontal"
                    flexItem
                    sx={{ display: { xs: "block", md: "none" }, flex: 1 }}
                  />
                  <Typography
                    variant="body2"
                    color="text.disabled"
                    fontWeight={600}
                  >
                    OR
                  </Typography>
                  <Divider
                    orientation="horizontal"
                    flexItem
                    sx={{ display: { xs: "block", md: "none" }, flex: 1 }}
                  />
                </Box>
              </Grid>

              {/* Section 2: Correct quantity */}
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 2.5,
                    border: "1px solid",
                    borderColor: "warning.light",
                    borderRadius: 1,
                    height: "100%",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Correct Quantity
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Sets the quantity to an exact value. Use this to fix an incorrect entry. A reason is required and will appear in history.
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <FormInput
                      id="correctQuantity"
                      name="correctQuantity"
                      placeholder="Enter the correct quantity"
                      label="Correct Quantity (set to exact value)"
                      type="number"
                      optional={true}
                      error={
                        touched.correctQuantity
                          ? errors.correctQuantity
                          : ("" as any)
                      }
                    />
                    <FormInput
                      id="reason"
                      name="reason"
                      placeholder="e.g. Stock count was entered incorrectly, physical count shows 50 units"
                      label="Reason for Correction"
                      type="text"
                      optional={false}
                      error={touched.reason ? errors.reason : ""}
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                pt: "3rem",
              }}
            >
              {isSubmitting ? (
                <ActionButton text="loading" disabled />
              ) : (
                <ActionButton text="Submit" type="submit" />
              )}
            </Box>
          </Form>
        )}
      </Formik>
    </Box>
  );
}
