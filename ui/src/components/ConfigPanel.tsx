import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import SaveIcon from "@mui/icons-material/Save";

interface ConfigPanelProps {
  ddClient: any;
}

interface Config {
  llm_provider: string;
  llm_model: string;
  llm_base_url: string;
  llm_max_concurrent: string;
  enable_observations: string;
  llm_api_key?: string;
}

const LLM_PROVIDERS = [
  { value: "none", label: "None (offline mode)" },
  { value: "ollama", label: "Ollama (local)" },
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "openai-compatible", label: "OpenAI-compatible" },
];

export default function ConfigPanel({ ddClient }: ConfigPanelProps) {
  const [config, setConfig] = useState<Config>({
    llm_provider: "none",
    llm_model: "",
    llm_base_url: "",
    llm_max_concurrent: "1",
    enable_observations: "false",
  });
  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await ddClient.extension.vm?.service?.get("/config");
        if (res) {
          setConfig(res);
        }
      } catch {
        // Backend may not be ready
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    try {
      await ddClient.extension.vm?.service?.post("/config", {
        ...config,
        llm_api_key: apiKey || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Handle error
    }
  };

  const needsApiKey = config.llm_provider !== "none" && config.llm_provider !== "ollama";
  const needsBaseUrl =
    config.llm_provider === "ollama" || config.llm_provider === "openai-compatible";

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <SettingsIcon color="primary" />
                <Typography variant="h6">LLM Configuration</Typography>
              </Box>

              <Alert severity="info" sx={{ mb: 3 }}>
                An LLM is <strong>not required</strong> for core memory operations. The{" "}
                <code>retain</code> tool works with <code>verbatim</code> and{" "}
                <code>chunks</code> strategies without any LLM. The <code>recall</code>{" "}
                tool uses local embeddings. Configure an LLM only if you want advanced
                features like fact extraction.
              </Alert>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>LLM Provider</InputLabel>
                <Select
                  value={config.llm_provider}
                  label="LLM Provider"
                  onChange={(e) =>
                    setConfig({ ...config, llm_provider: e.target.value })
                  }
                >
                  {LLM_PROVIDERS.map((p) => (
                    <MenuItem key={p.value} value={p.value}>
                      {p.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {config.llm_provider !== "none" && (
                <TextField
                  fullWidth
                  label="Model"
                  value={config.llm_model}
                  onChange={(e) => setConfig({ ...config, llm_model: e.target.value })}
                  sx={{ mb: 2 }}
                  helperText='e.g., "gpt-4o-mini", "llama3.2", "claude-sonnet-4-20250514"'
                />
              )}

              {needsBaseUrl && (
                <TextField
                  fullWidth
                  label="Base URL"
                  value={config.llm_base_url}
                  onChange={(e) =>
                    setConfig({ ...config, llm_base_url: e.target.value })
                  }
                  sx={{ mb: 2 }}
                  helperText='e.g., "http://host.docker.internal:11434" for Ollama'
                />
              )}

              {needsApiKey && (
                <TextField
                  fullWidth
                  label="API Key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  sx={{ mb: 2 }}
                  helperText="Your API key (stored as environment variable)"
                />
              )}

              <TextField
                fullWidth
                label="Max Concurrent LLM Requests"
                type="number"
                value={config.llm_max_concurrent}
                onChange={(e) =>
                  setConfig({ ...config, llm_max_concurrent: e.target.value })
                }
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={config.enable_observations === "true"}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        enable_observations: e.target.checked ? "true" : "false",
                      })
                    }
                  />
                }
                label="Enable Observations"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                When enabled, Hindsight will automatically observe and extract facts from
                agent interactions.
              </Typography>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                >
                  Save Configuration
                </Button>
                {saved && (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    Configuration saved. Restart the Hindsight service to apply changes.
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Retain Strategies
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                When storing memories without an LLM, use these strategies:
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="primary">
                  verbatim
                </Typography>
                <Typography variant="body2">
                  Stores text exactly as provided. Best for short, specific facts.
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="primary">
                  chunks
                </Typography>
                <Typography variant="body2">
                  Splits text into overlapping chunks for better search. Best for longer
                  content.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="primary">
                  extract (requires LLM)
                </Typography>
                <Typography variant="body2">
                  Uses an LLM to extract discrete facts. Best quality but needs LLM
                  config.
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Docker MCP Gateway
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Register Hindsight with Docker MCP Gateway:
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
                <Typography
                  component="pre"
                  variant="body2"
                  fontFamily="monospace"
                  fontSize={11}
                  sx={{ whiteSpace: "pre-wrap" }}
                >
                  {`docker mcp gateway connect \\
  agent-memory \\
  http://localhost:8888/mcp/default/`}
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
