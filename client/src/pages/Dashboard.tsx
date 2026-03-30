import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { FileText, Image, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { data: pages } = trpc.pages.list.useQuery({ limit: 5 });
  const { data: articles } = trpc.articles.list.useQuery({ limit: 5 });
  const { data: media } = trpc.media.list.useQuery({ limit: 5 });

  if (loading) {
    return <DashboardLayout><div className="p-8">Loading...</div></DashboardLayout>;
  }

  if (!user) {
    return <DashboardLayout><div className="p-8">Not authenticated</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-8">
        <div>
          <h1 className="text-3xl font-bold">CMS Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back, {user.name || user.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pages</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pages?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Total pages in system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Articles</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{articles?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Total articles in system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Media</CardTitle>
              <Image className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{media?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Total media files</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pages" className="w-full">
          <TabsList>
            <TabsTrigger value="pages">Pages</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>

          <TabsContent value="pages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Pages</CardTitle>
                <CardDescription>Latest pages created in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {pages && pages.length > 0 ? (
                  <div className="space-y-4">
                    {pages.map(page => (
                      <div key={page.id} className="border-b pb-4 last:border-b-0">
                        <h3 className="font-semibold">{page.title}</h3>
                        <p className="text-sm text-muted-foreground">{page.slug}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs bg-secondary px-2 py-1 rounded">{page.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <p>No pages yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="articles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Articles</CardTitle>
                <CardDescription>Latest articles created in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {articles && articles.length > 0 ? (
                  <div className="space-y-4">
                    {articles.map(article => (
                      <div key={article.id} className="border-b pb-4 last:border-b-0">
                        <h3 className="font-semibold">{article.title}</h3>
                        <p className="text-sm text-muted-foreground">{article.slug}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs bg-secondary px-2 py-1 rounded">{article.status}</span>
                          {article.category && <span className="text-xs bg-primary/10 px-2 py-1 rounded">{article.category}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <p>No articles yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Media</CardTitle>
                <CardDescription>Latest media files uploaded to the system</CardDescription>
              </CardHeader>
              <CardContent>
                {media && media.length > 0 ? (
                  <div className="space-y-4">
                    {media.map(file => (
                      <div key={file.id} className="border-b pb-4 last:border-b-0">
                        <h3 className="font-semibold">{file.filename}</h3>
                        <p className="text-sm text-muted-foreground">{file.mimeType}</p>
                        {file.size && <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <p>No media files yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
