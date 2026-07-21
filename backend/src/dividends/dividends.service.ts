import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDividendDto } from './dto/create-dividend.dto';

@Injectable()
export class DividendsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.dividend.findMany({
      where: { userId },
      include: { holding: { select: { symbol: true, name: true, type: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async create(userId: string, dto: CreateDividendDto) {
    const holding = await this.prisma.investmentHolding.findUnique({
      where: { id: dto.holdingId },
    });
    if (!holding) throw new NotFoundException('Holding not found');
    if (holding.userId !== userId) throw new ForbiddenException();

    return this.prisma.dividend.create({
      data: {
        userId,
        holdingId: dto.holdingId,
        amount: dto.amount,
        perShare: dto.perShare,
        date: new Date(dto.date),
        note: dto.note,
      },
      include: { holding: { select: { symbol: true, name: true, type: true } } },
    });
  }

  async delete(id: string, userId: string) {
    const dividend = await this.prisma.dividend.findUnique({ where: { id } });
    if (!dividend) throw new NotFoundException('Dividend not found');
    if (dividend.userId !== userId) throw new ForbiddenException();
    return this.prisma.dividend.delete({ where: { id } });
  }

  async getSummary(userId: string) {
    const dividends = await this.prisma.dividend.findMany({
      where: { userId },
    });

    const total = dividends.reduce((s: number, d) => s + Number(d.amount), 0);

    const byYear: Record<number, number> = {};
    for (const d of dividends) {
      const year = new Date(d.date).getFullYear();
      byYear[year] = (byYear[year] ?? 0) + Number(d.amount);
    }

    return { total, byYear };
  }
}
