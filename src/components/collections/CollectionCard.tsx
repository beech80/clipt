import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder, FolderOpen, Tag } from "lucide-react";
import { useState } from "react";

interface CollectionCardProps {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  createdAt: string;
  thumbnailUrl?: string | null;
  category: string;
  tags: string[];
  postCount: number;
}

export const CollectionCard = ({
  id,
  name,
  description,
  isPrivate,
  createdAt,
  thumbnailUrl,
  category,
  tags,
  postCount,
}: CollectionCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className="transition-all duration-200 hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {thumbnailUrl ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
          <img
            src={thumbnailUrl}
            alt={name}
            className="object-cover w-full h-full"
          />
        </div>
      ) : null}
      <CardHeader>
        <div className="flex items-center gap-2">
          {isHovered ? (
            <FolderOpen className="h-6 w-6 text-primary" />
          ) : (
            <Folder className="h-6 w-6 text-primary" />
          )}
          <CardTitle className="line-clamp-1">{name}</CardTitle>
        </div>
        {description && (
          <CardDescription className="line-clamp-2">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            {postCount} {postCount === 1 ? 'post' : 'posts'}
          </p>
          {category && (
            <div className="flex items-center gap-1">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground capitalize">
                {category}
              </span>
            </div>
          )}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-secondary px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <span className="text-xs text-muted-foreground">
          {new Date(createdAt).toLocaleDateString()}
        </span>
        {isPrivate && (
          <span className="text-xs bg-secondary px-2 py-1 rounded">
            Private
          </span>
        )}
      </CardFooter>
    </Card>
  );
};