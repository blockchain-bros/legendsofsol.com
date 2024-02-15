import {
  Box,
  Button,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { GM } from "../components/GM";

export default function WL() {
  const [handle, setHandle] = useState("");
  const [type, setType] = useState("add-user");
  const [response, setResponse] = useState("");
  const [challenge, setChallenge] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: session } = useSession();

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/whitelist/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ handle, type, challenge }),
    });
    const res = await response.json();
    setResponse(res);
    setLoading(false);
  };
  return (
    <Container maxWidth="sm" sx={{ pb: 10 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
        {!session && <GM />}
        </Grid>
        <Grid item xs={12}>
          <Stack
            spacing={2}
            component="form"
            noValidate
            autoComplete="off"
            onSubmit={handleSubmit}
            sx={{
              mt: 5,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <TextField
              id="handle"
              label="Handle"
              value={handle}
              onChange={(e) => {
                setResponse("");
                setHandle(e.target.value);
              }}
            />
            <TextField
              id="challenge"
              label="Challenge"
              value={challenge}
              onChange={(e) => {
                setResponse("");
                setChallenge(e.target.value);
              }}
            />
            <FormControl fullWidth>
              <InputLabel id="select-type">Type</InputLabel>
              <Select
                labelId="select-type"
                id="select-type"
                value={type}
                label="Type"
                onChange={(e) => setType(e.target.value)}
                sx={{
                  "& svg": {
                    color: "white"
                  }
                }}
              >
                <MenuItem value={"add-user"}>Add user</MenuItem>
                <MenuItem value={"delete-user"}>Delete user</MenuItem>
              </Select>
            </FormControl>
            <Button type="submit" variant="contained" disabled={loading}>
              Submit
            </Button>
          </Stack>
          {response ? (
            <Box>
              <pre>{JSON.stringify(response, null, 2)}</pre>
            </Box>
          ) : null}
        </Grid>
      </Grid>
    </Container>
  );
}
