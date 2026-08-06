import {
  Component,
  Input
} from '@angular/core';

@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.html',
  styleUrl: './toast.scss'
})
export class ToastComponent {

  @Input()
  message = '';

  @Input()
  visible = false;
}