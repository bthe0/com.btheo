import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from "typeorm";
import { IsNotEmpty, IsString, IsBoolean, MaxLength, ArrayNotEmpty, Min, ValidateNested, IsInt, IsOptional, validate, ValidationError } from "class-validator";
import { Type, plainToClass } from "class-transformer";
import { User } from "./User";
import { Label } from "./Label";
import type { Relation } from "typeorm";

@Entity()
export class Snippet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @Column("text")
  @IsNotEmpty()
  @IsString()
  content: string;

  @Column({ default: 0 })
  @IsInt()
  @Min(0)
  views: number;

  @Column({ default: 0 })
  @IsInt()
  @Min(0)
  loved: number;

  @Column()
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  language: string;

  @Column({ default: false })
  @IsBoolean()
  isFeatured: boolean;

  @ManyToOne('User', 'snippets')
  @ValidateNested()
  @Type(() => User)
  author: Relation<User>;
  
  @ManyToMany(() => Label, (label) => label.snippets)
  @JoinTable()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Label)
  labels: Label[];
}