import type { ReactNode } from 'react';
import GlassCard, { type GlassCardProps } from './GlassCard';

type CardProps = Omit<GlassCardProps, 'level'>;

export default function Card({ children, style, ...props }: CardProps & { children?: ReactNode }) {
	return <GlassCard gradientBorder="subtle" style={style} {...props}>{children}</GlassCard>;
}
