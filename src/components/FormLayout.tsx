import { forwardRef, Ref, ReactElement } from "react";

// types
import { KeyedObject } from "types/root";
import { Box, Grid } from "@mui/material";
import ActionButton from "./ActionButton";

export interface FormLayoutProps extends KeyedObject {
  inputs: ReactElement[];
  submitButtonText: string;
  isSubmitting: boolean;
  showSubmitButton?: boolean;
}

// ==============================|| FORM LAYOUT - FORMIK ||============================== //

function FormLayout(
  { inputs, submitButtonText, isSubmitting, showSubmitButton = true }: FormLayoutProps,
  ref: Ref<HTMLDivElement>
) {

  return (
    <>
      <Grid container rowSpacing={"1.5rem"} columnSpacing={"1rem"}>
        {inputs.map((input, idx) => (
          <Grid key={idx} item xs={12} md={6} sx={{ width: "100%" }}>
            {input}
          </Grid>
        ))}
      </Grid>
      {showSubmitButton && <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          paddingTop: "3rem",
        }}
      >
        {isSubmitting ? (
          <ActionButton text={'loading'} disabled />
        ) : (
          <ActionButton text={submitButtonText} type="submit" />
        )}
      </Box>}
    </>
  );
}

export default forwardRef(FormLayout);
