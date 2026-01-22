/**
 * 媒体信息卡片组件
 * 展示视频的详细元数据信息
 */

import {
  CalendarMonth as DateIcon,
  Videocam as DirectorIcon,
  Movie as MovieIcon,
  Person as PersonIcon,
  AccessTime as RuntimeIcon,
  Star as StarIcon,
  Theaters as StudioIcon,
} from "@mui/icons-material";
import { Box, Chip, Divider, Grid, Link, Paper, Skeleton, styled, Typography } from "@mui/material";
import type { MediaInfo } from "@/store/scrapeStore";
import { QuickActions } from "./QuickActions";

interface MediaInfoCardProps {
  media: MediaInfo | null;
  loading?: boolean;
  onActorClick?: (actor: string) => void;
  onPosterClick?: () => void;
  onThumbClick?: () => void;
  onRescrape?: () => void;
}

const InfoRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
  "& .MuiSvgIcon-root": {
    marginTop: 2,
    color: theme.palette.text.secondary,
    fontSize: 18,
  },
}));

const InfoLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  minWidth: 60,
  flexShrink: 0,
}));

const InfoValue = styled(Typography)({
  flex: 1,
  wordBreak: "break-word",
});

const PosterImage = styled("img")(({ theme }) => ({
  width: "100%",
  maxWidth: 200,
  height: "auto",
  borderRadius: theme.shape.borderRadius,
  cursor: "pointer",
  transition: "transform 0.2s, box-shadow 0.2s",
  "&:hover": {
    transform: "scale(1.02)",
    boxShadow: theme.shadows[4],
  },
}));

const ThumbImage = styled("img")(({ theme }) => ({
  width: "100%",
  height: "auto",
  borderRadius: theme.shape.borderRadius,
  cursor: "pointer",
  transition: "transform 0.2s, box-shadow 0.2s",
  "&:hover": {
    transform: "scale(1.02)",
    boxShadow: theme.shadows[4],
  },
}));

function LoadingSkeleton() {
  return (
    <Paper sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="50%" />
          <Skeleton variant="rectangular" height={60} sx={{ mt: 1 }} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Skeleton variant="rectangular" height={280} />
        </Grid>
      </Grid>
    </Paper>
  );
}

function EmptyState() {
  return (
    <Paper sx={{ p: 4, textAlign: "center" }}>
      <MovieIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
      <Typography color="text.secondary">暂无媒体信息</Typography>
      <Typography variant="body2" color="text.disabled">
        开始刮削后，媒体信息将显示在这里
      </Typography>
    </Paper>
  );
}

export function MediaInfoCard({
  media,
  loading,
  onActorClick,
  onPosterClick,
  onThumbClick,
  onRescrape,
}: MediaInfoCardProps) {
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!media) {
    return <EmptyState />;
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Grid container spacing={2}>
        {/* 左侧信息区 */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* 番号、标题和快速操作 */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {media.number}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {media.title}
              </Typography>
            </Box>
            <QuickActions filePath={media.filePath} nfoPath={media.nfoPath} onRescrape={onRescrape} />
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* 详细信息 */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {/* 演员 */}
            {media.actors && media.actors.length > 0 && (
              <InfoRow>
                <PersonIcon />
                <InfoLabel variant="body2">演员</InfoLabel>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {media.actors.map((actor, index) => (
                    <Link
                      key={`${actor}-${index}`}
                      component="button"
                      variant="body2"
                      onClick={() => onActorClick?.(actor)}
                      sx={{ cursor: "pointer" }}
                    >
                      {actor}
                      {index < media.actors.length - 1 ? "," : ""}
                    </Link>
                  ))}
                </Box>
              </InfoRow>
            )}

            {/* 发布日期 */}
            {media.release && (
              <InfoRow>
                <DateIcon />
                <InfoLabel variant="body2">日期</InfoLabel>
                <InfoValue variant="body2">{media.release}</InfoValue>
              </InfoRow>
            )}

            {/* 时长 */}
            {media.runtime && (
              <InfoRow>
                <RuntimeIcon />
                <InfoLabel variant="body2">时长</InfoLabel>
                <InfoValue variant="body2">{media.runtime} 分钟</InfoValue>
              </InfoRow>
            )}

            {/* 导演 */}
            {media.director && (
              <InfoRow>
                <DirectorIcon />
                <InfoLabel variant="body2">导演</InfoLabel>
                <InfoValue variant="body2">{media.director}</InfoValue>
              </InfoRow>
            )}

            {/* 制作商 */}
            {media.studio && (
              <InfoRow>
                <StudioIcon />
                <InfoLabel variant="body2">制作</InfoLabel>
                <InfoValue variant="body2">{media.studio}</InfoValue>
              </InfoRow>
            )}

            {/* 发行商 */}
            {media.publisher && (
              <InfoRow>
                <StudioIcon />
                <InfoLabel variant="body2">发行</InfoLabel>
                <InfoValue variant="body2">{media.publisher}</InfoValue>
              </InfoRow>
            )}

            {/* 系列 */}
            {media.series && (
              <InfoRow>
                <MovieIcon />
                <InfoLabel variant="body2">系列</InfoLabel>
                <InfoValue variant="body2">{media.series}</InfoValue>
              </InfoRow>
            )}

            {/* 评分 */}
            {media.score !== undefined && media.score > 0 && (
              <InfoRow>
                <StarIcon sx={{ color: "warning.main" }} />
                <InfoLabel variant="body2">评分</InfoLabel>
                <InfoValue variant="body2" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {media.score.toFixed(1)}
                </InfoValue>
              </InfoRow>
            )}
          </Box>

          {/* 简介 */}
          {media.outline && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                简介
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                {media.outline}
              </Typography>
            </Box>
          )}

          {/* 标签 */}
          {media.tags && media.tags.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                标签
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {media.tags.map((tag, index) => (
                  <Chip key={`${tag}-${index}`} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}

          {/* 来源 */}
          {media.source && (
            <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 2 }}>
              数据来源: {media.source}
            </Typography>
          )}
        </Grid>

        {/* 右侧图片区 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {media.posterUrl && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                  海报
                </Typography>
                <PosterImage
                  src={media.posterUrl}
                  alt={`${media.number} poster`}
                  onClick={onPosterClick}
                  loading="lazy"
                />
              </Box>
            )}
            {media.thumbUrl && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                  缩略图
                </Typography>
                <ThumbImage
                  src={media.thumbUrl}
                  alt={`${media.number} thumbnail`}
                  onClick={onThumbClick}
                  loading="lazy"
                />
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

export default MediaInfoCard;
