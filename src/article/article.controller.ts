import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, UsePipes } from '@nestjs/common';
import { ArticleService } from './article.service';
import { AuthGuard } from '@app/user/guards/auth.guard';
import { User } from '@app/user/decorators/user.decorator';
import { CreateArticleDto } from './dto/createArticle.dto';
import { UserEntity } from '@app/user/user.entity';
import { ArticleResponse } from './types/articleResponse.interface';
import { UpdateArticleDto } from './dto/updateArticle.dto';
import { ArticlesResponse } from './types/articlesResponse.interface';
import { QueryFilters } from './types/queryFilters.type';
import { AppValidationPipe } from '@app/shared/validation.pipe';
import { CreateCommentDto } from './dto/createCommentDto';
import { ApiTags } from '@nestjs/swagger';

import { ArticleEntity } from './article.entity';
import { AppSwagger } from '@app/swagger.config';
// import { sleep } from '@app/shared/sleep';

@ApiTags('articles')
@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @AppSwagger({ wrapName: 'article', model: ArticleEntity })
  @Get('feed')
  @UseGuards(AuthGuard)
  async getFeed(@User('id') userId: number, @Query() query: QueryFilters) {

    return this.articleService.getFeed(userId, query);
  }

  @Get()
  async findAll(@User('id') currentUserId: number, @Query() query: QueryFilters): Promise<ArticlesResponse> {
    // await sleep()
    return await this.articleService.findAll(currentUserId, query);
  }

  @Post()
  @UseGuards(AuthGuard)
  @UsePipes(new AppValidationPipe())
  public async create(@User() user: UserEntity, @Body('article') createArticleDto: CreateArticleDto): Promise<ArticleResponse> {
    const article = await this.articleService.create(user, createArticleDto);
    return this.articleService.buildArticleResponse(article);
  }

  @Post(':slug/comments')
  @UseGuards(AuthGuard)
  public async createComment(
    @User('id') userId: number,
    @Body('comment', new AppValidationPipe()) createCommentDto: CreateCommentDto,
    @Param('slug') slug: string,
  ) {
    const comment = await this.articleService.createComment(slug, createCommentDto, userId);

    return { comment };
  }

  @Get(':slug')
  public async findBySlug(@Param('slug') slug: string, @User('id') currentUserId: number) {
    const article = await this.articleService.findBySlug(slug, currentUserId);
    return { article };
  }

  @Delete(':slug')
  @UseGuards(AuthGuard)
  public async deleteArticle(@User('id') userId: number, @Param('slug') slug: string) {
    return await this.articleService.deleteArticle(slug, userId);
  }

  @Put(':slug')
  @UseGuards(AuthGuard)
  @UsePipes(new AppValidationPipe())
  public async updateArticle(@User('id') userId: number, @Param('slug') slug: string, @Body('article') updateArticleDto: UpdateArticleDto) {
    const article = await this.articleService.updateArticle(slug, userId, updateArticleDto);
    return this.articleService.buildArticleResponse(article);
  }

  @Post(':slug/favorite')
  @UseGuards(AuthGuard)
  public async favorite(@User('id') userId: number, @Param('slug') slug: string) {
    const article = await this.articleService.favorite(userId, slug);
    return this.articleService.buildArticleResponse(article);
  }

  @Delete(':slug/favorite')
  @UseGuards(AuthGuard)
  public async unfavorite(@User('id') userId: number, @Param('slug') slug: string) {
    const article = await this.articleService.unfavorite(userId, slug);
    return this.articleService.buildArticleResponse(article);
  }

  @Get(':slug/comments')
  public async getComments(@Param('slug') slug: string, @User('id') userId: number) {
    const comments = await this.articleService.getArticleComments(slug, userId);
    // await sleep()
    return comments;
  }

  @Delete(':slug/comments/:id')
  public async deleteComment(@Param('slug') slug: string, @Param('id') commentId: number, @User('id') userId: number) {
    return await this.articleService.deleteComment(slug, commentId, userId);
  }
}
