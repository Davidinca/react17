import React from 'react';
import { useForm } from 'react-hook-form';
import { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../hooks/useLogin.js';
import {Card, Label, TextInput, Button,} from 'flowbite-react';
import { HiOutlineUser, HiOutlineLockClosed } from 'react-icons/hi2';

export default function Login() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const { handleLogin, fieldErrors, clearFieldError } = useLogin();

    return (
        <div className="min-h-screen flex items-center justify-center py-8 px-4">
            <Toaster position="top-right" />

            <Card className="w-full max-w-md p-6">
                <h1 className="text-2xl font-bold mb-6 text-primary-700 text-center">
                    Inicio de Sesión
                </h1>

                <form onSubmit={handleSubmit(handleLogin)} className="flex flex-col gap-5">
                    {/* Código Cotel */}
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="codigocotel">Código Cotel</Label>
                        </div>
                        <TextInput
                            id="codigocotel"
                            type="text"
                            placeholder="Ingresa tu código"
                            icon={HiOutlineUser}
                            className="text-base"
                            {...register('codigocotel', {
                                required: 'El código Cotel es obligatorio',
                                pattern: { value: /^\d+$/, message: 'Sólo números' }
                            })}
                            color={errors.codigocotel || fieldErrors.codigocotel ? 'failure' : undefined}
                            onFocus={() => clearFieldError('codigocotel')}
                            required
                        />
                        {(errors.codigocotel || fieldErrors.codigocotel) && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.codigocotel?.message || fieldErrors.codigocotel}
                            </p>
                        )}
                    </div>

                    {/* Contraseña */}
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="password">Contraseña</Label>
                        </div>
                        <TextInput
                            id="password"
                            type="password"
                            placeholder="Ingresa tu contraseña"
                            icon={HiOutlineLockClosed}
                            className="text-base"
                            {...register('password', {
                                required: 'La contraseña es obligatoria',
                                minLength: { value: 4, message: 'Mínimo 4 caracteres' }
                            })}
                            color={errors.password || fieldErrors.password ? 'failure' : undefined}
                            onFocus={() => clearFieldError('password')}
                            required
                        />
                        {(errors.password || fieldErrors.password) && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.password?.message || fieldErrors.password}
                            </p>
                        )}
                    </div>

                    {/* Botones */}
                    <Button
                        type="submit"
                        className="bg-primary-500 hover:bg-primary-600 text-base py-3"
                    >
                        Ingresar
                    </Button>
                    <Button
                        type="button"
                        onClick={() => navigate('/migrar')}
                        className="bg-secondary-500 hover:bg-secondary-600 text-base py-3"
                    >
                        Migrar Usuario
                    </Button>
                </form>
            </Card>
        </div>
    );
}