import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from "typeorm";
import { IsNotEmpty, IsString, IsDate, ValidateNested, MaxLength, IsEmail, IsOptional, IsUrl, validate, ValidationError } from "class-validator";
import { Type, plainToClass } from "class-transformer";
import { BlogPost } from "./BlogPost";
import type { Relation } from "typeorm";

@Entity()
export class Comment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    name: string;

    @Column("text")
    @IsNotEmpty()
    @IsString()
    @MaxLength(1000)
    content: string;

    @Column({ nullable: true })
    @IsOptional()
    @IsEmail()
    @MaxLength(255)
    email?: string;

    @Column({ nullable: true })
    @IsOptional()
    @IsUrl()
    @MaxLength(255)
    website?: string;

    @ManyToOne(() => BlogPost, post => post.comments)
    @ValidateNested()
    @Type(() => BlogPost)
    post: Relation<BlogPost>

    @CreateDateColumn()
    @IsDate()
    createdAt: Date;

    static async validate(entryData: Partial<Comment>): Promise<{ [key: string]: string[] }> {
        const entry = plainToClass(Comment, entryData);
        const errors = await validate(entry);
        
        return errors.reduce((acc, error: ValidationError) => {
          if (error.property && error.constraints) {
            acc[error.property] = Object.values(error.constraints);
          }
          return acc;
        }, {} as { [key: string]: string[] });
    } 
}