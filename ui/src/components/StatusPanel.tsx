import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Typography,
  Paper,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import StorageIcon from "@mui/icons-material/Storage";
import HubIcon from "@mui/icons-material/Hub";
import MemoryIcon from "@mui/icons-material/Memory";

interface StatusPanelProps {
  ddClient: any;
}

interface HealthStatus {
  status: string;
  hindsight: boolean;
  message?: string;
  details?: any;
}

interface AppStatus {
  hindsight_ready: boolean;
  bank_count: number;
  mcp_endpoint: string;
  api_endpoint: string;
  ui_endpoint: string;
}

export default function StatusPanel({ ddClient }: StatusPanelProps) {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const healthRes = await ddClient.extension.vm?.service?.get("/health");
      setHealth(healthRes);
    } catch {
      setHealth({ status: "error", hindsight: false, message: "Cannot reach backend" });
    }
    try {
      const statusRes = await ddClient.extension.vm?.service?.get("/status");
      setStatus(statusRes);
    } catch {
      // Backend may not be ready
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Connecting to Hindsight...</Typography>
      </Box>
    );
  }

  const isRunning = health?.hindsight === true;

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <StorageIcon color="primary" />
                <Typography variant="h6">Hindsight Engine</Typography>
              </Box>
              <Chip
                icon={
                  isRunning ? (
                    <CheckCircleIcon />
                  ) : health?.status === "starting" ? (
                    <HourglassEmptyIcon />
                  ) : (
                    <ErrorIcon />
                  )
                }
                label={health?.status ?? "unknown"}
                color={isRunning ? "success" : health?.status === "starting" ? "warning" : "error"}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <MemoryIcon color="primary" />
                <Typography variant="h6">Memory Banks</Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {status?.bank_count ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <HubIcon color="primary" />
                <Typography variant="h6">MCP Endpoint</Typography>
              </Box>
              <Typography
                variant="body2"
                fontFamily="monospace"
                sx={{ wordBreak: "break-all" }}
              >
                {status?.mcp_endpoint ?? "http://localhost:8888/mcp/{bank_id}/"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Connect Your Agents
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Add the following MCP server configuration to your AI agent:
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Claude Desktop / Claude Code (claude_desktop_config.json):
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
            <Typography component="pre" variant="body2" fontFamily="monospace" fontSize={12}>
              {JSON.stringify(
                {
                  mcpServers: {
                    "agent-memory": {
                      url: "http://localhost:8888/mcp/default/",
                    },
                  },
                },
                null,
                2
              )}
            </Typography>
          </Paper>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Docker MCP Gateway:
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
            <Typography component="pre" variant="body2" fontFamily="monospace" fontSize={12}>
              {`docker mcp gateway connect agent-memory http://localhost:8888/mcp/default/`}
            </Typography>
          </Paper>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Cursor / VS Code (mcp.json):
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
            <Typography component="pre" variant="body2" fontFamily="monospace" fontSize={12}>
              {JSON.stringify(
                {
                  servers: {
                    "agent-memory": {
                      type: "http",
                      url: "http://localhost:8888/mcp/default/",
                    },
                  },
                },
                null,
                2
              )}
            </Typography>
          </Paper>
        </Box>
      </Paper>

      {!isRunning && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Hindsight is starting up. The embedded Postgres database takes 10-15 seconds to
          initialize on first launch. Please wait...
        </Alert>
      )}
    </Box>
  );
}
